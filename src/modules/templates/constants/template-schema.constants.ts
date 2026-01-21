export const TEMPLATE_CONSTRAINTS = {
  CODE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
  },
  NAME: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 150,
  },
  DESCRIPTION: {
    MAX_LENGTH: 2000,
  },
  VERSION: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 20,
  },
} as const
