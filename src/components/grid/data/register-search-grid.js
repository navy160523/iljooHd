import { ValueType } from 'realgrid';

export const fields = [
  {
    fieldName: 'Name',
    dataType: ValueType.TEXT
  },
  {
    fieldName: 'BirthDate',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'Sex',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'EmploymentTF',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'Phone',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'AuthTF',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'OnlineId',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'OnlineCompliteDate',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'SafeCompliteDate',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'SafeExpireDate',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'Address',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'Email',
    dataType: ValueType.TEXT,
  },
  {
    fieldName: 'Token',
    dataType: ValueType.TEXT,
  }
];

export const columns = [
  {
    name: 'Name',
    fieldName: 'Name',
    width: '120',
    styles: {
        textAlignment: 'center',
      },
    header: {
      text: '성명',
    }
  },
  {
    name: 'BirthDate',
    fieldName: 'BirthDate',
    width: '100',
    styles: {
      textAlignment: 'center',
    },
    header: {
      text :'생년월일',
    },
  },
  {
    name: 'Sex',
    fieldName: 'Sex',
    width: '40',
    header: {
      text: '성별',
    },
  },
  {
    name: 'EmploymentTF',
    fieldName: 'EmploymentTF',
    width: '90',
    header: {
      text: '재직여부',
    }
  },
  {
    name: 'Phone',
    fieldName: 'Phone',
    width: '120',
    header: {
      text: '핸드폰번호',
    }
  },
  {
    name: 'AuthTF',
    fieldName: 'AuthTF',
    width: '80',
    header: {
      text: '인증여부',
    },
  },
  {
    name: 'OnlineId',
    fieldName: 'OnlineId',
    width: '100',
    header: {
      text: '온라인교육ID',
    }
  },
  {
    name: 'OnlineCompliteDate',
    fieldName: 'OnlineCompliteDate',
    width: '182',
    header: {
      text: '온라인교육 이수일',
    }
  },
  {
    name: 'SafeCompliteDate',
    fieldName: 'SafeCompliteDate',
    width: '182',
    header: {
      text: '안전대면 교육이수일',
    }
  },
  {
    name: 'SafeExpireDate',
    fieldName: 'SafeExpireDate',
    width: '182',
    header: {
      text: '안전대면 교육만료일',
    }
  },
  {
    name: 'Address',
    fieldName: 'Address',
    width: '250',
    header: {
      text: '주소',
    }
  },
  {
    name: 'Email',
    fieldName: 'Email',
    width: '200',
    header: {
      text: 'Email',
    }
  },
  {
    name: 'Token',
    fieldName: 'Token',
    width: '160',
    header: {
      text: '본인인증 Token',
    }
  }
];

export const rows = [
  {
    Name: '홍길동',
    BirthDate: '1991324',
    Sex: '여',
    EmploymentTF: '재직',
    Phone : '010-1231-1231',
    AuthTF : 'Y',
    OnlineId : 'S234234',
    OnlineCompliteDate : '2023.09.12',
    SafeCompliteDate : '2023.09.13',
    SafeExpireDate: '2023.09.14',
    Address : '울산 광역시 울주대로 234 2번길',
    Email: 'satwektj@naver.com',
    Token: '-'
  },{
    Name: '홍길동',
    BirthDate: '1991324',
    Sex: '여',
    EmploymentTF: '재직',
    Phone : '010-1231-1231',
    AuthTF : 'Y',
    OnlineId : 'S234234',
    OnlineCompliteDate : '2023.09.12',
    SafeCompliteDate : '2023.09.13',
    SafeExpireDate: '2023.09.14',
    Address : '울산 광역시 울주대로 234 2번길',
    Email: 'satwektj@naver.com',
    Token: '-'
  },{
    Name: '홍길동',
    BirthDate: '1991324',
    Sex: '여',
    EmploymentTF: '재직',
    Phone : '010-1231-1231',
    AuthTF : 'Y',
    OnlineId : 'S234234',
    OnlineCompliteDate : '2023.09.12',
    SafeCompliteDate : '2023.09.13',
    SafeExpireDate: '2023.09.14',
    Address : '울산 광역시 울주대로 234 2번길',
    Email: 'satwektj@naver.com',
    Token: '-'
  },{
    Name: '홍길동',
    BirthDate: '1991324',
    Sex: '여',
    EmploymentTF: '재직',
    Phone : '010-1231-1231',
    AuthTF : 'Y',
    OnlineId : 'S234234',
    OnlineCompliteDate : '2023.09.12',
    SafeCompliteDate : '2023.09.13',
    SafeExpireDate: '2023.09.14',
    Address : '울산 광역시 울주대로 234 2번길',
    Email: 'satwektj@naver.com',
    Token: '-'
  },{
    Name: '홍길동',
    BirthDate: '1991324',
    Sex: '여',
    EmploymentTF: '재직',
    Phone : '010-1231-1231',
    AuthTF : 'Y',
    OnlineId : 'S234234',
    OnlineCompliteDate : '2023.09.12',
    SafeCompliteDate : '2023.09.13',
    SafeExpireDate: '2023.09.14',
    Address : '울산 광역시 울주대로 234 2번길',
    Email: 'satwektj@naver.com',
    Token: '-'
  },{
    Name: '홍길동',
    BirthDate: '1991324',
    Sex: '여',
    EmploymentTF: '재직',
    Phone : '010-1231-1231',
    AuthTF : 'Y',
    OnlineId : 'S234234',
    OnlineCompliteDate : '2023.09.12',
    SafeCompliteDate : '2023.09.13',
    SafeExpireDate: '2023.09.14',
    Address : '울산 광역시 울주대로 234 2번길',
    Email: 'satwektj@naver.com',
    Token: '-'
  },{
    Name: '홍길동',
    BirthDate: '1991324',
    Sex: '여',
    EmploymentTF: '재직',
    Phone : '010-1231-1231',
    AuthTF : 'Y',
    OnlineId : 'S234234',
    OnlineCompliteDate : '2023.09.12',
    SafeCompliteDate : '2023.09.13',
    SafeExpireDate: '2023.09.14',
    Address : '울산 광역시 울주대로 234 2번길',
    Email: 'satwektj@naver.com',
    Token: '-'
  },
  {
    Name: '홍길동',
    BirthDate: '1991324',
    Sex: '여',
    EmploymentTF: '재직',
    Phone : '010-1231-1231',
    AuthTF : 'Y',
    OnlineId : 'S234234',
    OnlineCompliteDate : '2023.09.12',
    SafeCompliteDate : '2023.09.13',
    SafeExpireDate: '2023.09.14',
    Address : '울산 광역시 울주대로 234 2번길',
    Email: 'satwektj@naver.com',
    Token: '-'
  },
  {
    Name: '홍길동',
    BirthDate: '1991324',
    Sex: '여',
    EmploymentTF: '재직',
    Phone : '010-1231-1231',
    AuthTF : 'Y',
    OnlineId : 'S234234',
    OnlineCompliteDate : '2023.09.12',
    SafeCompliteDate : '2023.09.13',
    SafeExpireDate: '2023.09.14',
    Address : '울산 광역시 울주대로 234 2번길',
    Email: 'satwektj@naver.com',
    Token: '-'
  },
  {
    Name: '홍길동',
    BirthDate: '1991324',
    Sex: '여',
    EmploymentTF: '재직',
    Phone : '010-1231-1231',
    AuthTF : 'Y',
    OnlineId : 'S234234',
    OnlineCompliteDate : '2023.09.12',
    SafeCompliteDate : '2023.09.13',
    SafeExpireDate: '2023.09.14',
    Address : '울산 광역시 울주대로 234 2번길',
    Email: 'satwektj@naver.com',
    Token: '-'
  },
  
  
];