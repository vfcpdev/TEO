export const VALIDATION_MESSAGES = {
  required: 'Este campo es requerido',
  email: 'Ingrese un email válido',
  minlength: 'Debe tener al menos {requiredLength} caracteres',
  maxlength: 'No puede exceder {requiredLength} caracteres',
  pattern: 'Formato inválido',
  min: 'El valor mínimo es {min}',
  max: 'El valor máximo es {max}',

  // Custom validators
  codeExists: 'Este código ya existe',
  invalidTimeRange: 'La hora de fin debe ser posterior a la hora de inicio',
  scheduleConflict: 'Existe un conflicto con otro curso en este horario',
  invalidCsvFormat: 'El formato del archivo CSV no es válido',
  duplicateStudent: 'El estudiante ya está registrado en este curso',
};
