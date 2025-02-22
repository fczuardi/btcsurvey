export const mockSurveys = {
  fabricioSurvey: {
    id: "mock-survey-1",
    data: {
      totalRespondents: 27,
      distributions: {
        "Turista ou local?": {
          type: "categorical",
          frequency: {
            "Local": 23,
            "Turista": 3,
            "": 1
          },
          total: 27
        },
        "Você tem Bitcoin?": {
          type: "categorical",
          frequency: {
            "Não": 20,
            "Sim": 7
          },
          total: 27
        }
      },
      metadata: {
        location: "ACATE-Floripa",
        interviewer: "Fabricio",
        date: "2025-02-21",
        filename: "acate_survey.csv"
      }
    },
    uploaded_by: "fabricio_npub",
    filename: "acate_survey.csv",
    uploaded_at: "2025-02-21T13:49:41Z"
  },
  emiliaSurvey: {
    id: "mock-survey-2",
    data: {
      totalRespondents: 23,
      distributions: {
        "Are you a tourist or do you live here, so you are local?": {
          type: "categorical",
          frequency: {
            "Local": 8,
            "Tourist": 15
          },
          total: 23
        },
        "De zero a 10, o quanto você conhece de Bitcoin": {
          type: "numeric",
          average: 2.87,
          median: 2,
          min: 0,
          max: 10,
          histogram: {
            bins: [10, 3, 3, 2, 2, 2, 0, 1, 0, 0],
            binSize: 1,
            min: 0,
            max: 10
          }
        },
        "De zero a 10 o quanto voce acredita ser importante a educaçao financeira desde a infancia?": {
          type: "numeric",
          average: 8.7,
          median: 10,
          min: 5,
          max: 10,
          histogram: {
            bins: [0, 0, 0, 0, 3, 0, 0, 2, 0, 18],
            binSize: 0.5,
            min: 5,
            max: 10
          }
        }
      },
      metadata: {
        location: "SantoAntonioDeLisboa-Floripa",
        interviewer: "Emilia",
        date: "2025-02-21",
        filename: "santo_antonio_survey.csv"
      }
    },
    uploaded_by: "emilia_npub",
    filename: "santo_antonio_survey.csv",
    uploaded_at: "2025-02-21T19:57:54Z"
  }
};