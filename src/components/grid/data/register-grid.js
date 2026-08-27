import { ValueType } from 'realgrid';

export const fields = [
  {
    fieldName: 'Title',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'FileName',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'Ext',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'Size',
    dataType: ValueType.NUMBER,
  },
  {
    fieldName: 'RegistDate',
    dataType: ValueType.TEXT,
  }
];

export const columns = [
  {
    name: 'Title',
    fieldName: 'Title',
    width: '280',
    styles: {
        textAlignment: 'center'
      },
    header: {
      text: '제목',
    }
  },
  {
    name: 'FileName',
    fieldName: 'FileName',
    width: '166',
    styles: {
        textAlignment: 'center',
      },
    header: {
      text: '파일명',
    }
  },
  {
    name: 'Ext',
    fieldName: 'Ext',
    width: '60',
    styles: {
      textAlignment: 'center',
    },
    header: {
      text :'확장자',
    }
  },
  {
    name: 'Size',
    fieldName: 'Size',
    width: '160',
    header: {
      text: '용량',
    },
    lookupDisplay: true,
    values: [
      0
    ],
    labels: [
      "-"
    ],
    numberFormat: 0
  },
  {
    name: 'RegistDate',
    fieldName: 'RegistDate',
    width: '146',
    header: {
      text: '첨부날짜',
    }
  },
];

export const rows = [
  {
    Title: '2023 연말결산',
    FileName: '연말결산안내.hwp',
    Ext: 'hwp',
    Size: 100,
    RegistDate: ''
  },
  {
    Title: '2024 새신년회안내',
    FileName: '신년회식안내',
    Ext: 'hwp',
    Size: 0,
    RegistDate: ''
  },
  {
    Title: '2024 자리 배치 안내',
    FileName: '자리배치도',
    Ext: 'jpeg',
    Size: 0,
    RegistDate: ''
  },
  {
    Title: '2024 행사 계획 안내',
    FileName: '행사계획서.docx',
    Ext: 'docx',
    Size: 10,
    RegistDate: ''
  }
];