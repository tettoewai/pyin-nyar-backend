import { Controller, Get } from "@nestjs/common";
import { QuizService } from "./quiz.service.js";

@Controller("admin/quiz")
export class QuizAdminController {
  constructor(private readonly quizService: QuizService) {}

  @Get()
  async adminFindAll() {
    return this.quizService.adminFindAll();
  }
}
