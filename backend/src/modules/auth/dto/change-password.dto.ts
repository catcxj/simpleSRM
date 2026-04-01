import { IsNotEmpty, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
    @ApiProperty({ description: 'The current password' })
    @IsNotEmpty()
    oldPassword: string;

    @ApiProperty({ description: 'The new password' })
    @IsNotEmpty()
    @MinLength(6, { message: 'Password must be at least 6 characters' })
    newPassword: string;

    @ApiProperty({ description: 'Confirmation of the new password' })
    @IsNotEmpty()
    confirmPassword: string;
}
