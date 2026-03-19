import {
	Body,
	Controller,
	Get,
	HttpException,
	HttpStatus,
	Param,
	Patch,
	Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpsertOAuth42UserDto } from './dto/upsert-oauth42-user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { IUserProfile } from './interfaces/users-service.interface';

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post('oauth/42/upsert')
	async upsertOAuth42User(@Body() dto: UpsertOAuth42UserDto): Promise<IUserProfile> {
		try {
			return await this.usersService.upsertOAuth42User(dto);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error al guardar usuario OAuth42',
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	@Get(':id')
	async findById(@Param('id') id: string): Promise<IUserProfile> {
		try {
			return await this.usersService.findById(id);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.NOT_FOUND);
		}
	}

	@Get('42/:fortyTwoId')
	async findBy42Id(@Param('fortyTwoId') fortyTwoId: string): Promise<IUserProfile> {
		try {
			return await this.usersService.findBy42Id(parseInt(fortyTwoId, 10));
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.NOT_FOUND);
		}
	}

	@Get('login/:login')
	async findByLogin(@Param('login') login: string): Promise<IUserProfile> {
		try {
			return await this.usersService.findByLogin(login);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.NOT_FOUND);
		}
	}

	@Patch(':id/profile')
	async updateProfile(@Param('id') id: string, @Body() dto: UpdateUserProfileDto): Promise<IUserProfile> {
		try {
			return await this.usersService.updateProfile(id, dto);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error al actualizar perfil',
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
}
