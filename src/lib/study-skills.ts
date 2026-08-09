export const STUDY_SKILLS = [
  { id: "vocabulario", label: "Vocabulário" },
  { id: "gramatica", label: "Gramática" },
  { id: "listening", label: "Listening" },
  { id: "speaking", label: "Speaking" },
  { id: "leitura", label: "Leitura" },
  { id: "escrita", label: "Escrita" },
] as const

export type StudySkillId = (typeof STUDY_SKILLS)[number]["id"]

export const getStudySkillLabel = (id: string) =>
  STUDY_SKILLS.find((skill) => skill.id === id)?.label ?? id
