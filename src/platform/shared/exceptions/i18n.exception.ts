import { I18nValidationExceptionFilter } from 'nestjs-i18n';
import { ValidationError } from 'class-validator';

export function I18nException() {
  return new I18nValidationExceptionFilter({
    errorFormatter: (errors: ValidationError[]) => {
      const formattedErrors: Record<string, string> = {};

      errors.forEach((error) => {
        const constraints = error.constraints;

        if (constraints) {
          const firstKey = Object.keys(constraints)[0];
          formattedErrors[error.property] = constraints[firstKey]
            .replace(`${error.property}: `, '')
            .trim();
        }
      });

      return {
        errors: formattedErrors,
      };
    },
  });
}
