import { getCustomRepository,Not, IsNull } from "typeorm";
import { Request, Response } from "express";
import { SurveysUsersRepository } from "../repositories/SurveysUsersRepository";

class NpsController {

  async execute(request: Request, response: Response) {
    const { survey_id } = request.params;

    const surveysUserRepository = getCustomRepository(SurveysUsersRepository);

    const surveyUser = await surveysUserRepository.find({
      survey_id,
      value: Not(IsNull())
    });

    const detractor = surveyUser.filter((survey) => {
      return survey.value >= 0 && survey.value <= 6;
    }).length;

    const promoters = surveyUser.filter((survey) => {
      return survey.value >= 9 && survey.value <= 10;
    }).length;

    const passive = surveyUser.filter((survey) => {
      return survey.value >= 7 && survey.value <= 8;
    }).length;

    const totalAnswers = passive + promoters + detractor;

    const calculate = Number(((promoters - detractor) / totalAnswers * 100).toFixed(2));

    return response.json({
        detractor,
        promoters,
        passive,
        totalAnswers,
        nps: calculate
    })
  }
}

export { NpsController };
