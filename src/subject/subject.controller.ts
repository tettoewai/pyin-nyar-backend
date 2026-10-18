import { Controller, Get } from "@nestjs/common";
import { SubjectService } from "./subject.service.js";

@Controller("subject")
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Get("/")
  get() {
    return this.subjectService.findAll();
  }
}
