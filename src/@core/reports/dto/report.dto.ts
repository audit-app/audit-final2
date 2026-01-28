import { IsOptional, IsNumber, Min, Max } from 'class-validator'

export class GenerateReportDto {
  @IsOptional()
  @IsNumber()
  @Min(400)
  @Max(1200)
  width?: number = 800

  @IsOptional()
  @IsNumber()
  @Min(300)
  @Max(800)
  height?: number = 600
}
