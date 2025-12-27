export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  photo?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  photo?: string;
}

export interface UpdateUserDto {
  id: string;
  firstName?: string;
  lastName?: string;
  photo?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
