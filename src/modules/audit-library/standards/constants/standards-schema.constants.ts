export const STANDARDS_CONSTRAINTS = {
  CODE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
  },
  TITLE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 200,
  },
  DESCRIPTION: {
    MAX_LENGTH: 2000,
  },
} as const
