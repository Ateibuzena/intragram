import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpException,
	HttpStatus,
	Param,
	Patch,
	Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpsertOAuth42UserDto } from './dto/upsert-oauth42-user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@Controller()
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post('users/oauth/42/upsert')
	@HttpCode(HttpStatus.OK)
	async upsertOAuth42(@Body() profile: UpsertOAuth42UserDto) {
		try {
			return await this.usersService.upsertFromOAuth42(profile);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error al guardar usuario de OAuth 42',
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	@Get('users/:id')
	async findById(@Param('id') id: string) {
		try {
			return await this.usersService.findById(id);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.NOT_FOUND);
		}
	}

	@Get('users/42/:fortyTwoId')
	async findBy42Id(@Param('fortyTwoId') fortyTwoId: string) {
		try {
			return await this.usersService.findBy42Id(parseInt(fortyTwoId, 10));
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.NOT_FOUND);
		}
	}

	@Get('users/login/:login')
	async findByLogin(@Param('login') login: string) {
		try {
			return await this.usersService.findByLogin(login);
		} catch (error: any) {
			throw new HttpException(error.message, error.statusCode || HttpStatus.NOT_FOUND);
		}
	}

	@Patch('users/:id/profile')
	async updateProfile(@Param('id') id: string, @Body() dto: UpdateUserProfileDto) {
		try {
			return await this.usersService.updateProfile(id, dto);
		} catch (error: any) {
			throw new HttpException(
				error.message || 'Error al actualizar perfil',
				error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	@Get('health')
	async health() {
		return this.usersService.getHealth();
	}
}
