import { Injectable }   from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

//  import { QuestionBase } from './question-base';

@Injectable()
export class TeamCohesionControlService {
  constructor() { }

  toFormGroup(questions: { label: string, statement: string }[] ) {
      let group: any = {};

      questions.forEach(question => {
          group[question.label] = new FormControl('');
      });

      return new FormGroup(group);
  }
}
