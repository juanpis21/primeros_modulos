import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { TokenRecuperacion } from './entities/token-recuperacion.entity';
import { SolicitarRecuperacionDto } from './dto/solicitar-recuperacion.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UsersService } from '../users/users.service';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class TokenRecuperacionService {
  constructor(
    @InjectRepository(TokenRecuperacion)
    private tokenRepository: Repository<TokenRecuperacion>,
    private usersService: UsersService,
    private mailerService: MailerService,
  ) { }

  async solicitarRecuperacion(dto: SolicitarRecuperacionDto): Promise<{ mensaje: string }> {
    const usuario = await this.usersService.findByEmail(dto.email);
    if (!usuario) {
      throw new NotFoundException(`El correo electrónico ${dto.email} no está registrado en la base de datos.`);
    }

    await this.tokenRepository.delete({ usuarioId: usuario.id });

    const nuevoToken = crypto.randomBytes(32).toString('hex');
    const fechaExpiracion = new Date();
    fechaExpiracion.setMinutes(fechaExpiracion.getMinutes() + 10);

    const ticket = this.tokenRepository.create({
      token: nuevoToken,
      usuarioId: usuario.id,
      fechaExpiracion,
    });

    await this.tokenRepository.save(ticket);

    try {
      const urlRecuperacion = `http://localhost:4200/recovery?token=${nuevoToken}`;
      await this.mailerService.sendMail({
        to: usuario.email,
        subject: 'Recuperación de Contraseña - HelpyourPet',
        html: `
          <div style="font-family: Arial, sans-serif; text-align: center; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #4CAF50;">Clínica Veterinaria HelpyourPet</h2>
            <p style="font-size: 16px;">Hola <b>${usuario.fullName || usuario.username}</b>,</p>
            <p>Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para continuar:</p>
            <div style="margin: 30px 0;">
              <a href="${urlRecuperacion}" 
                 style="background-color: #2e9e44; color: white; padding: 14px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                 Restablecer mi contraseña
              </a>
            </div>
            <p style="font-size: 14px; color: #666;">Este enlace expirará en 10 minutos por tu seguridad.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
          </div>
        `,
      });
    } catch (e) {
      console.log('Error enviando correo SMTP: ', e.message);
      throw new InternalServerErrorException('Error enviando correo SMTP: ' + e.message);
    }

    return { 
      mensaje: 'Recuperación inicializada con éxito. Revisa tu correo electrónico para continuar.'
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ mensaje: string }> {
    // 1. Validamos que el ticket exista
    const ticket = await this.tokenRepository.findOne({ where: { token: dto.token } });

    if (!ticket) {
      throw new BadRequestException('El Token de Recuperación es inválido o nunca fue creado.');
    }

    const hoy = new Date();
    if (hoy > ticket.fechaExpiracion) {
      await this.tokenRepository.delete(ticket.id);
      throw new BadRequestException('El Token ha superado sus 10 minutos de vida. Debe solicitar uno nuevo.');
    }

    const usuario = await this.usersService.findOne(ticket.usuarioId);
    if (!usuario) {
      throw new NotFoundException('Usuario asociado al token ya no existe.');
    }
    
    await this.usersService.update(usuario.id, { password: dto.nuevaContrasena });
    await this.tokenRepository.delete(ticket.id);

    return { mensaje: 'Contraseña actualizada con éxito!' };
  }
}
