import { ValueType } from 'realgrid';

export const fields = [
  {
    fieldName: 'DetailInfo',
    dataType: ValueType.TEXT
  },
  {
    fieldName: 'Progress',
    dataType: ValueType.TEXT
  },
  {
    fieldName: 'RiskTarget1',
    dataType: ValueType.BOOLEAN
  },
  {
    fieldName: 'RiskTarget2',
    dataType: ValueType.BOOLEAN,
  },
  {
    fieldName: 'PermissionNumber',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'ConstructionNumber',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'ConstructionType',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'ConstructionContent',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'ConstructionDate',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'Place',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'Organize',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'Manager1',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'Manager2',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'Worker',
    dataType: ValueType.TEXT,
  },
];

export const columns = [
  {
    name: 'DetailInfo',
    fieldName: 'DetailInfo',
    width: '60',
    styles: {
        textAlignment: 'center'
      },
    header: {
      text: '상세정보',
    },
  },
  {
    name: 'Progress',
    fieldName: 'Progress',
    width: '100',
    styles: {
        textAlignment: 'center'
      },
    header: {
      text: '진행상태',
    },
  },
  {
    name: 'RiskTarget1',
    fieldName: 'RiskTarget1',
    width: '90',
    styles: {
        textAlignment: 'center'
      },
    header: {
      text: '위험작업대상1',
    },
    renderer: { 
      type: 'check' ,
      trueValues : '',
      falseValues : '',
      editable: false
    },
    editable:false
  },
  {
    name: 'RiskTarget2',
    fieldName: 'RiskTarget2',
    width: '90',
    styles: {
        textAlignment: 'center'
      },
    header: {
      text: '위험작업대상2',
    },
    renderer: { 
      type: 'check' ,
      trueValues : '',
      falseValues : '',
    }

  },
  {
    name: 'PermissionNumber',
    fieldName: 'PermissionNumber',
    width: '160',
    styles: {
        textAlignment: 'center'
      },
    header: {
      text: '허가서번호',
    },
    editable: false
  },
  {
    name: 'ConstructionNumber',
    fieldName: 'ConstructionNumber',
    width: '120',
    styles: {
        textAlignment: 'center',
      },
    header: {
      text: '공사번호',
    },
  },
  {
    name: 'ConstructionType',
    fieldName: 'ConstructionType',
    width: '120',
    styles: {
      textAlignment: 'center',
    },
    header: {
      text :'작업분류',
    },
  },
  {
    name: 'ConstructionContent',
    fieldName: 'ConstructionContent',
    width: '235',
    header: {
      text: '작업내용',
    },
  },
  {
    name: 'ConstructionDate',
    fieldName: 'ConstructionDate',
    width: '250',
    header: {
      text: '작업기간',
    },
  },
  {
    name: 'Place',
    fieldName: 'Place',
    width: '200',
    header: {
      text: '작업장소',
    },
  },
  {
    name: 'Organize',
    fieldName: 'Organize',
    width: '150',
    header: {
      text: '작업조직',
    },
  },
  {
    name: 'Manager1',
    fieldName: 'Manager1',
    width: '150',
    header: {
      text: '작업책임자1',
    },
  },
  {
    name: 'Manager2',
    fieldName: 'Manager2',
    width: '150',
    header: {
      text: '작업책임자2',
    },
  },
  {
    name: 'Worker',
    fieldName: 'Worker',
    width: '150',
    header: {
      text: '작업인원',
    },
  }
];

export const rows = [
  {
    DetailInfo: '',
    Progress: '작성중(시외)',
    RiskTarget1: true,
    RiskTarget2: true,
    PermissionNumber: 'AN00-OS20230301-0013',
    ConstructionNumber: 'K0003296-20230004-0',
    ConstructionType: '화기작업',
    ConstructionContent: '엔진안전 테스트: 허가테스트',
    ConstructionDate: '2023.02.27 08:00~2023.02.27 08:00',
    Place : '-',
    Organize : '안전기획과',
    Manager1 : '이승열',
    Manager2 : '0107772343',
    Worker : '2명'
  },
  {
    DetailInfo: '',
    Progress: 'HHI접수대기',
    RiskTarget1: true,
    RiskTarget2: false,
    PermissionNumber: 'AN00-OS20230301-0013',
    ConstructionNumber: 'K0003296-20230004-0',
    ConstructionType: '화기작업',
    ConstructionContent: '엔진안전 테스트: 허가테스트',
    ConstructionDate: '2023.02.27 08:00~2023.02.27 08:00',
    Place : '울산 광역시 울주대로 234 2번길',
    Organize : '안전기획과',
    Manager1 : '이승열',
    Manager2 : '0107772343',
    Worker : '2명'
  },{
    DetailInfo: '',
    Progress: '작성중(시외)',
    RiskTarget1: false,
    RiskTarget2: true,
    PermissionNumber: 'AN00-OS20230301-0013',
    ConstructionNumber: 'K0003296-20230004-0',
    ConstructionType: '화기작업',
    ConstructionContent: '엔진안전 테스트: 허가테스트',
    ConstructionDate: '2023.02.27 08:00~2023.02.27 08:00',
    Place : '울산 광역시 울주대로 234 1번길',
    Organize : '안전기획과',
    Manager1 : '이승열',
    Manager2 : '0107772343',
    Worker : '2명'
  },{
    DetailInfo: '',
    Progress: '작성중(시외)',
    RiskTarget1: false,
    RiskTarget2: false,
    PermissionNumber: 'AN00-OS20230301-0013',
    ConstructionNumber: 'K0003296-20230004-0',
    ConstructionType: '화기작업',
    ConstructionContent: '엔진안전 테스트: 허가테스트',
    ConstructionDate: '2023.02.27 08:00~2023.02.27 08:00',
    Place : '울산 광역시 울주대로 234 1번길',
    Organize : '안전기획과',
    Manager1 : '이승열',
    Manager2 : '0107772343',
    Worker : '2명'
  },
  
];