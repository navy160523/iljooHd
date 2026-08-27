import Message from '@hiway/utils/notify'
import { isEmpty } from '@core/utils/index'

/*
< PARAMETER >
1. from: 시작일
2. to: 종료일
3. option: 메세지 변경 옵션
  - nonFrom: 시작일이 없을 때 메세지
  - nonTo: 종료일이 없을 때 메세지
  - overFrom: 시작일이 클 때 메세지
< OUTPUT >
1. result: 유효성여부
  - true: 통과
  - false: 오류
2. status: 상태별 코드값
  - -1: 통과
  - 0: 시작일이 없을 때
  - 1: 종료일이 없을 때
  - 2: 시작일이 종료일 보다 클 때
Ex) validDateRange('2024-03-29', '2024-03-28', { overFrom: 'dsagsdagsdgasdg' })
Ex) validDateRange('2024-03-29', '2024-03-28')
*/
export function validDateRange(from, to, option = {}) {
  let nonFrom = '시작일을 확인해 주세요.'
  let nonTo = '종료일을 확인해 주세요.'
  let overFrom = '시작일은 종료일보다 클 수 없습니다.'

  if(option.nonFrom) {
    nonFrom = option.nonFrom
  }

  if(option.nonTo) {
    nonTo = option.nonTo
  }

  if(option.overFrom) {
    overFrom = option.overFrom
  }
  
  if(!from) {
    Message.warn(nonFrom)
    return { result: false, status: 0 }
  } else if(!to) {
    Message.warn(nonTo)
    return { result: false, status: 1 }
  } else if(from > to) {
    Message.warn(overFrom)
    return { result: false, status: 2 }
  }

  return { result: true, status: -1 }
}

//2024-05-07 김우빈
//YYYY-MM-DD 오늘 날짜 구해서 가져옴.
//default: 0 현재 날짜에서 날짜를 추가 혹은 뺄때 setDay 로 처리.
export function yearMonthDay(setDay) {
  let dayValue = 0
  //setDay 에서 받아오는 값 없을시 0값으로 오늘 날짜 출력
  if (!isEmpty(setDay)) {
    dayValue = setDay
  }
  const calDate = new Date() 
  const dateObject = new Date(calDate)
  
  dateObject.setDate(calDate.getDate()+dayValue)
  const year = dateObject.getFullYear()
  const month = String(dateObject.getMonth() + 1).padStart(2, '0') // 월은 0부터 시작하므로 +1 필요
  const day = String(dateObject.getDate()).padStart(2, '0')
  const yyyyMMddString = `${year}-${month}-${day}`
  return yyyyMMddString
}

/***
 * 2024-06-20 김우빈
 * email 형식 체크
 */
export function email_regx(val) {
  
  let email_regx = /^[A-Za-z0-9_\.\-]+@[A-Za-z0-9\-]+\.[A-za-z0-9\-]+/
  return email_regx.test(val)
}

/***
 * 2024-06-20 김우빈
 * 휴대폰 형식 체크
 */
export function phone_regx(number) {

  let phone_regx = /^(01[016789]{1})-?[0-9]{4}-?[0-9]{4}$/;
  return phone_regx.test(number);
}

/***
 * 2024-07-09 박용훈
 * QR코드  도메인 리턴
 */
export function getQDomain() {
  var hostname = window.location.hostname
  // 운영서버 도메인
  var url = 'https://m-hises.hd.com'
  if(hostname!=='hises.hd.com'){
    // 개발서버 도메인
    url ='https://hisesmtest.hd.com:44823'
  }
  return url;
}

export function create_UUID() {
  let dt = new Date().getTime()

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = (dt + Math.random() * 16) % 16 | 0
    dt = Math.floor(dt / 16)

    return (c == "x" ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export function chkEmpty(data) {
  return data == undefined || data == null || (data + '').replace(/ /g, '') === ''
}