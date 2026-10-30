import { Controller, Get } from "@nestjs/common";
import { Public } from "../auth/decorators/public.decorator.js";
import { SubjectService } from "./subject.service.js";

@Public()
@Controller("subject")
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Get("/")
  get() {
    return this.subjectService.findAll();
  }
}
