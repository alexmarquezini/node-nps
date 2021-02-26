import { Request, response, Response } from "express";
import { getCustomRepository } from "typeorm";
import { SurveyRepository } from "../repositories/SurveyRepository";
import { UsersRepository } from "../repositories/UsersRepository";
import { SurveysUsersRepository } from "../repositories/SurveysUsersRepository";
import SendMailService from "../services/SendMailService";
import { resolve } from "path";

class SendMailController {
  async execute(request: Request, response: Response) {
    const { email, survey_id } = request.body;

    const usersRepository = getCustomRepository(UsersRepository);
    const surveyRepository = getCustomRepository(SurveyRepository);
    const surveyUserRepository = getCustomRepository(SurveysUsersRepository);

    const user = await usersRepository.findOne({ email });

    if (!user) {
      return response.status(400).json({
        error: "User does not exists",
      });
    }

    const survey = await surveyRepository.findOne({
      id: survey_id,
    });

    if (!survey) {
      return response.status(400).json({
        error: "Survey does not exists",
      });
    }

    const npsPath = resolve(__dirname, "..", "views", "emails", "npsMail.hbs");

    const variables = {
      name: user.name,
      title: survey.title,
      description: survey.description,
      user_id: user.id,
      link: process.env.URL_MAIL,
    };

    const surveyUserAlreadyExists = await surveyUserRepository.findOne({
      where: [{ user_id: user.id }, { value: null }],
      relations: ["user", "survey"]
    });

    if (surveyUserAlreadyExists) {
      await SendMailService.execute(email, survey.title, variables, npsPath);
      return response.status(200).json(surveyUserAlreadyExists);
    }

    const surveyUser = surveyUserRepository.create({
      user_id: user.id,
      survey_id,
    });

    await surveyUserRepository.save(surveyUser);

    await SendMailService.execute(email, survey.title, variables, npsPath);

    return response.status(201).json(surveyUser);
  }

  async deleteAll(request: Request, response: Response) {
    try {
      const surveyUserRepository = getCustomRepository(SurveysUsersRepository);

      await surveyUserRepository.clear();

      return response.status(200).json({ message: "Deleted successfully!"});
    } catch (err) {
      return response
        .status(500)
        .json({ error: "Internal server error!", err });
    }
  }
}

export { SendMailController };
