export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    mensaje?: string;
    error?: string;
    errors?: any;
}
