import { IsString, MaxLength } from 'class-validator';

export class CreateFriendDto {
	@IsString()
	@MaxLength(80)
	friend_login!: string;
}