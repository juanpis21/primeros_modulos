import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ServiciosService } from './servicios.service';
import { CreateServicioDto } from './dto/create-servicio.dto';
import { UpdateServicioDto } from './dto/update-servicio.dto';
import { Servicio } from './entities/servicio.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('servicios')
@Controller('servicios')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ServiciosController {
  constructor(private readonly serviciosService: ServiciosService) {}

  @Post()
  @UseInterceptors(FileInterceptor('imagen', {
    storage: diskStorage({
      destination: './uploads/servicios',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
        cb(null, `servicio_${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        cb(new BadRequestException('Solo se permiten imágenes'), false);
      } else {
        cb(null, true);
      }
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Crear un nuevo servicio' })
  @ApiResponse({ status: 201, description: 'Servicio creado exitosamente', type: Servicio })
  create(@Body() createServicioDto: CreateServicioDto, @UploadedFile() file?: Express.Multer.File) {
    if (file) {
      createServicioDto.imagen = `/uploads/servicios/${file.filename}`;
    }
    return this.serviciosService.create(createServicioDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los servicios activos' })
  @ApiResponse({ status: 200, description: 'Lista de servicios', type: [Servicio] })
  findAll() {
    return this.serviciosService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un servicio por ID' })
  @ApiParam({ name: 'id', description: 'ID del servicio' })
  @ApiResponse({ status: 200, description: 'Servicio encontrado', type: Servicio })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  findOne(@Param('id') id: string) {
    return this.serviciosService.findOne(+id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('imagen', {
    storage: diskStorage({
      destination: './uploads/servicios',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
        cb(null, `servicio_${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Actualizar un servicio' })
  @ApiParam({ name: 'id', description: 'ID del servicio' })
  @ApiResponse({ status: 200, description: 'Servicio actualizado', type: Servicio })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  update(
    @Param('id') id: string, 
    @Body() updateServicioDto: UpdateServicioDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    if (file) {
      updateServicioDto.imagen = `/uploads/servicios/${file.filename}`;
    }
    return this.serviciosService.update(+id, updateServicioDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar un servicio' })
  @ApiParam({ name: 'id', description: 'ID del servicio' })
  @ApiResponse({ status: 200, description: 'Servicio desactivado' })
  @ApiResponse({ status: 404, description: 'Servicio no encontrado' })
  remove(@Param('id') id: string) {
    return this.serviciosService.remove(+id);
  }
}
