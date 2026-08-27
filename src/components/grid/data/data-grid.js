import { ValueType } from 'realgrid';

export const fields = [
  {
    fieldName: 'Title',
    dataType: ValueType.TEXT
  },
  {
    fieldName: 'RegisterFile',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'Writer',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'WriteDate',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'Date',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'Hit',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'ReplyDate',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'ilNo',
    dataType: ValueType.TEXT,
  }
];

export const columns = [
  {
    name: 'Title',
    fieldName: 'Title',
    width: '1010',
    styles: {
        textAlignment: 'left',
      },
    header: {
      text: '제목',
    },
    styleName: 'column_left'
  },
  {
    name: 'RegisterFile',
    fieldName: 'RegisterFile',
    width: '100',
    styles: {
      textAlignment: 'center',
    },
    header: {
      text :'첨부자료[건]',
    },
  },
  {
    name: 'Writer',
    fieldName: 'Writer',
    width: '90',
    header: {
      text: '작성자',
    },
  },
  {
    name: 'WriteDate',
    fieldName: 'WriteDate',
    width: '200',
    header: {
      text: '작성일시',
    }
  },
  {
    name: 'Date',
    fieldName: 'Date',
    width: '80',
    header: {
      text: '게시기간',
    }
  },
  {
    name: 'Hit',
    fieldName: 'Hit',
    width: '80',
    header: {
      text: '조회[건]',
    },
  },
  {
    name: 'ReplyDate',
    fieldName: 'ReplyDate',
    width: '100',
    header: {
      text: '답글일시',
    }
  },
  {
    name: 'ilNo',
    fieldName: 'ilNo',
    width: '100',
    header: {
      text: '일련번호',
    }
  }
];

export const rows = [
  {
    Title: '단기공사 작업계획서 양식',
    RegisterFile: '1',
    Writer: '이규호',
    WriteDate: '2023.08.23 13:23:12',
    Date : '영구',
    Hit : '10',
    ReplyDate : '',
    ilNo : '1010'
  },{
    Title: '단기공사 화면설계서 양식',
    RegisterFile: '2',
    Writer: '이규호',
    WriteDate: '2023.08.23 13:23:12',
    Date : '영구',
    Hit : '10',
    ReplyDate : '',
    ilNo : '1010'
  },{
    Title: '메인화면 작업계획서 양식',
    RegisterFile: '5',
    Writer: '이규호',
    WriteDate: '2023.08.23 13:23:12',
    Date : '영구',
    Hit : '1',
    ReplyDate : '',
    ilNo : '1010'
  },{
    Title: '출입서류 및 양식',
    RegisterFile: '',
    Writer: '이규호',
    WriteDate: '2023.08.23 13:23:12',
    Date : '영구',
    Hit : '0',
    ReplyDate : '2023.08.24',
    ilNo : '1010'
  },{
    Title: '감기 조심하세요',
    RegisterFile: '1',
    Writer: '삼규호',
    WriteDate: '2023.08.23 00:23:12',
    Date : '영구',
    Hit : '-',
    ReplyDate : '',
    ilNo : '1010'
  },{
    Title: '코로나 190으로 인한 단기공사 출입신청',
    RegisterFile: '',
    Writer: '사규호',
    WriteDate: '2023.08.23 13:00:12',
    Date : '영구',
    Hit : '150',
    ReplyDate : '',
    ilNo : '1011'
  },
];