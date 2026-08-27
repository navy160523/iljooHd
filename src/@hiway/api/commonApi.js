import request from '@/utils/request'
import request2 from '@/utils/request'
import { isUseAPI } from '@hiway/utils/check'

export function commonRequest(url, data, method = 'post', contentType = 'application/json;charset=utf8', meta = null) {  
  if (isUseAPI()) {
    return request({
      url: url,
      headers: { 'Content-Type': contentType },
      method: method,
      meta: meta,
      data,
    })
  }

  return new Promise((resolve) => {
    if (data && data.queryId === 'searchEMP') {
      resolve({
        ORESULT_CUR: [
          {
            BSNS_CD: "AQ00",
            BSNS_NM: "해양플랜트사업부",
            ASGN_CD: "Q610",
            ASGN_SHRT_NM: "해양플랜트사업기획부",
            ASGN_NM: "해양플랜트사업기획부",
            JOB_ROW_CD: "01",
            JOB_ROW_NM: "사무직",
            UNT_DUTY_CD: "01",
            DEPT_CD: "Q610",
            DEPT_NM: "해양플랜트사업기획부",
            EMAIL: "admin@example.com",
            USER_DIV: "A",
            ORGN_DIV: "10",
            EMP_NO: data.param?.EMP_NO || 'admin',
            EMP_NM: "관리자",
            TEL_NO: "010-0000-0000",
            HND_PHN: "010-0000-0000",
            CMPNY_DIV: "HHI"
          }
        ]
      })
      return
    }

    if (data && (data.queryId === 'searchCommonCode' || data.queryId === 'searchCommonCodeF' || data.queryId === 'searchCommonCodeF2') && data.param?.ALL_UP_CD === 'HHIZ000') {
      resolve({
        ORESULT_CUR: [
          { COD: '100', TXT: 'HD한국조선해양' },
          { COD: '110', TXT: '현대예술관' },
          { COD: '200', TXT: 'HD현대일렉트릭' },
          { COD: '220', TXT: 'HD현대' },
          { COD: '240', TXT: '현대중공업파워시스템' },
          { COD: '310', TXT: 'HD현대마린솔루션' },
          { COD: '350', TXT: '현대삼호중공업' },
          { COD: '380', TXT: 'HD현대마린엔진' },
          { COD: '300', TXT: 'HD현대중공업' },
          { COD: 'HHI', TXT: 'HD현대중공업' },
          { COD: '320', TXT: 'HD현대사이트솔루션' }
        ]
      })
      return
    }

    if (data && data.queryId === 'SAFDC0010_SAVE01') {
      resolve({
        list: [{
          OUT_RES_VIO_NO: 'VIO-' + Date.now(),
          VIO_EMP_NO: data.list[0].VIO_EMP_NO,
          BSNS_CD: data.list[0].BSNS_CD,
          DEPT_CD: data.list[0].DEPT_CD,
          ASGN_CD: data.list[0].ASGN_CD,
          VIOLATOR: data.list[0].VIOLATOR,
          VIO_GDIV: data.list[0].VIO_GDIV
        }]
      })
      return
    }

    if (data && data.queryId === 'SAFDC0010_SAVE04') {
      resolve({
        list: [{
          OUT_RES_MNG_NO: 'MNG-' + Date.now(),
          MNG_NO: 'MNG-' + Date.now()
        }]
      })
      return
    }

    if (data && data.queryId === 'SAFDC0010_SAVE07') {
      resolve({
        list: [{
          MNG_NO: data.list[0].MNG_NO,
          STATUS: data.list[0].STATUS
        }]
      })
      return
    }

    if (data && data.queryId === 'SAFDC0010_DELETE01') {
      resolve({
        list: [{
          MNG_NO: data.list[0].MNG_NO
        }]
      })
      return
    }

    if (data && data.queryId === 'OPRAB0010_SAVE_01') {
      resolve({
        list: [{
          APPROVE_ID: data.list[0].APPROVE_ID
        }]
      })
      return
    }

    resolve({ ORESULT_CUR: [] })
  })
}

// 파일 다운로드용
export function commonRequest2(url, data, method = 'post', contentType = 'application/json;charset=utf8', meta = null) {
  if (isUseAPI()) {
    return request({
      url: url,
      method: method,
      meta: {
        getContentDisposition: true,
        useErrorMessage: false,
        useProgress: false,
      },
      data,
      responseType: 'blob',
    })
  }

  return new Promise((resolve) => {
    resolve(new Blob([]))
  })
}

//2024-04-23 김우빈
//meta 설정 위해서 추가
export function commonRequest3(url, data, meta, method = 'post', contentType = 'application/json;charset=utf8') {
  if (isUseAPI()) {
    return request({
      url: url,
      headers: { 'Content-Type': contentType },
      method: method,
      meta: meta,
      data,
    })
  }

  return commonRequest(url, data, method, contentType, meta)
}

//공통 조회서비스
export function commonSearchApi(data, meta = null) {
  // [김성현] meta 분기 추가
  if (meta == null) return commonRequest('/hse/common/selectList', data)
  else return commonRequest('/hse/common/selectList', data, 'post', 'application/json;charset=utf8', meta)
}

// 2024.03.25 박용훈 한번 호출로 한건의 select가 아닌 여러건의 select를 하기 위해 추가
// Params을 list 형식으로 전송 하며 리턴은 결과값을 모아서 리턴
export function commonSearchApi3(data) {
  return commonRequest('/hse/common/selectAddList', data)
}

//공통 조회서비스 (비 로그인용)
export function commonSearchnoAuthApi(data, meta = null) {
  // [김성현] meta 분기 추가
  if (meta == null) return commonRequest('/hse/noAuth/selectList', data)
  else return commonRequest('/hse/noAuth/selectList', data, 'post', 'application/json;charset=utf8', meta)
}

//공통 조회서비스 (MySql)
export function commonSearchMySqlApi(data, meta = null) {  
  if (meta == null) return commonRequest('/hse/common/selectListMySQL', data)
  else return commonRequest('/hse/common/selectListMySQL', data, 'post', 'application/json;charset=utf8', meta)
}

//공통 저장, 삭제 서비스(비 로그인용)
// 2025.08.12 [손상규] 추가
export function commonExecutenoAuthApi(data) {
  return commonRequest('/hse/noAuth/execute', data)
}

//공통 저장, 삭제 서비스
export function commonExecuteApi(data) {
  return commonRequest('/hse/common/execute', data)
}

//공통 저장, 삭제 서비스
export function commonExecuteApi2(data) {
  return commonRequest('/hse/common/execute2', data)
}

//메일전송 서비스
export function commonSendApi(data) {
  //console.log('메일전송 서비스 data', data)
  let mail = data.EMAIL[0].replace(/\s/g, '')
  console.log('메일전송 서비스 mail', '--' + mail + '--')
  if (mail !== '') {
    return commonRequest('/hse/common/mailsend', data)
  } else {
    // 메일주소가 공백 또는 스페이스바일 때는 아무거나 호출해서 return
    return commonRequest('/hse/utils/getClientIp', data)
  }
  // return commonRequest('/hse/common/mailsend', data)
}

// 2025.08.12 [손상규] 추가 - 로그인하지않고 메일을 보낼 경우 때문에 추가
export function commonSendnoAuthApi(data) {
  //console.log('메일전송 서비스 data', data)
  let mail = data.EMAIL[0].replace(/\s/g, '')
  console.log('메일전송 서비스 mail', '--' + mail + '--')
  if (mail !== '') {
    return commonRequest('/hse/noAuth/mailsend', data)
  } 
  // return commonRequest('/hse/common/mailsend', data)
}

//메일전송 서비스(사내)
export function commonSendByEmpNoApi(data) {
  return commonRequest('/hse/common/mailsendByEmpNo', data)
}

//1. 문자 전송
export function commonSendSMS(data) {
  return commonRequest('/hse/common/sendSMS', data)
}

//2. 카카오 워크 알림 전송
export function commonSendKakao(data) {
  return commonRequest('/hse/common/sendKakao', data)
}

//3. 하이오피스 결재
export function commonHiOfficeApproval(data) {
  return commonRequest('/hse/common/hiOfficeApproval', data)
}

// 단축 URL 생성
export function commonShortenUrl(data) {
  return commonRequest('/hse/common/shortenUrl', data)
}

// 결재 정보 조회
export function commonApprovalList(id, data) {
  return commonRequest('/hse/common/APPROVAL_APPLIST_02', {
    queryId: id,
    param: data,
  })
}

//공통 로그 저장 서비스
export function commonLogExecuteApi(data) {
  let comment = ''
  for (const [key, value] of Object.entries(data.params)) {
    if (comment === '') {
      //(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
      if (data.crudGbn === 'C') comment = '(생성입력: ' + key + ' = ' + value
      else if (data.crudGbn === 'R') comment = '(조회조건: ' + key + ' = ' + value
      else if (data.crudGbn === 'A') comment = '(조회조건: ' + key + ' = ' + value
      else if (data.crudGbn === 'U') comment = '(수정입력: ' + key + ' = ' + value
      else if (data.crudGbn === 'D') comment = '(삭제 : ' + key + ' = ' + value
      else if (data.crudGbn === 'P') comment = '(출력 : ' + key + ' = ' + value
    } else {
      comment += ', ' + key + ' = ' + value
    }
  }

  let params = {
    CMPNY_DIV: data.userStore.cmpnyDiv,
    USER_ID: data.userStore.userId,
    CONN_GBN: 'WEB',
    CONN_IP: data.userStore.clientIp,
    CONN_COMMENT: '[' + data.menuNm + '] 화면 - ' + data.mgs + ' ' + comment + ' )',
    CRUD_GBN: data.crudGbn,
    LOG_DESC: data.logDesc,
    MENU_ID: data.menuId,
  }

  //console.log(params)

  return commonExecuteApi({ queryId: 'COMMON_SAVE_LOG', list: [params] })
}

//공통 파일업로드
export function commonUploadFilesApi(data) {
  console.log(data, 'data')

  return commonRequest('/hse/common/uploadFiles', data, 'post', 'multipart/form-data')
}

//공통 파일삭제
export function commonDeletFilesApi(data) {
  console.log(data, 'data')

  return commonRequest('/hse/common/deletFiles', data)
}

//공통 파일다운로드
export function commonDownloadFilesApi(data) {
  console.log(data, 'data')

  return commonRequest2('/hse/common/downloadFiles', data)
}

//공통코드 콤보박스
export function getCodeList(allUpCd, cmpnyDiv = 'HHI', useFlag = 'Y', codeNameType = '0', level = null, fullYn = 'N') {
  let param = {
    CMPNY_DIV: cmpnyDiv,
    ALL_UP_CD: allUpCd,
    USE_FLAG: useFlag,
    CODE_NAME_TYPE: codeNameType,
    LEVEL: level,
  }

  let data = {
    queryId: '',
    param: param,
  }

  if (level) {
    data.queryId = 'searchCommonCodeF2'

    return commonSearchApi(data)
  } else if (fullYn == 'Y') {
    data.queryId = 'searchCommonCodeF'

    return commonSearchApi(data)
  } else {
    data.queryId = 'searchCommonCode'

    return commonSearchApi(data)
  }
}

//회사 콤보박스
export function getCompanyList() {
  return getCodeList('HHIZ000')
}

//엑셀 다운로드
export function commonExcelDownApi(data) {
  return commonRequest2('/hse/excel/excelBasicDown', data, 'post')
}

//위험성평가 표준복사
export function commonRskApi(data) {
  return commonRequest('/hse/workRisk/trans', data)
}

export function commonRskSaveApi(data) {
  return commonRequest('/hse/workRisk/post', data)
}

export function commonExcelWrkDetailApi(data) {
  // return commonRequest("/hse/EXCEL/WORK_DETAIL", data)
  return request({
    url: '/hse/excel/work_detail',
    method: 'post',
    meta: {
      getContentDisposition: true,
      useErrorMessage: false,
    },
    data,
    responseType: 'blob',
  })
}

export function commonWordExportApi(data) {
  // return commonRequest("/hse/EXCEL/WORK_DETAIL", data)
  return request({
    url: '/hse/word/word_export',
    method: 'post',
    meta: {
      getContentDisposition: true,
      useErrorMessage: false,
    },
    data,
    responseType: 'blob',
  })
}

export function commonWordExportApiVer2(data) {
  // return commonRequest("/hse/EXCEL/WORK_DETAIL", data)
  return request({
    url: '/hse/word/word_export_ver2',
    method: 'post',
    meta: {
      getContentDisposition: true,
      useErrorMessage: false,
    },
    data,
    responseType: 'blob',
  })
}

export function commonPostApprovalApi(params, data) {
  return request({
    url: '/hse/common/approval',
    method: 'post',
    params: params,
    data: data,
  })
}

//권한 그룹을 검색한다.
export function hiwayAuthGroupsApi(data, method) {
  return commonRequest('/hiway/authgroups/apps/xx08', data, method)
}

//사용자가 속한 권한 그룹을 조회한다.
export function hiwayUsersAuthGroupsApi(data, method = 'get') {
  return commonRequest(`/hiway/authgroups/apps/xx08/users/${data.user_id}`, data, method)
}

// 사용자의 권한 그룹 조회
export function hiwayUserMenuAuthsApi(data, method = 'get') {
  return commonRequest(`/hiway/authgroups/apps/${data.app_id}/user_id/${data.user_id}`, data, method)
}

//정보암호화
export function commonEncrypt(data) {
  return commonRequest('/hse/kakaopay/encrypt', data)
}

//정보복호화
export function commonDecrypt(data) {
  return commonRequest('/hse/kakaopay/decrypt', data)
}

// 적립가능여부 api 호출
export function commonGetEarnYN(data) {
  return commonRequest('/hse/kakaopay/getEarnableYN', data)
}

// 적립 api 호출 //
export function commonExchangePayPoint(data) {
  return commonRequest('/hse/kakaopay/ExchangePayPoint', data)
}

// 1주일 기상예보
export function commonGetWeather(data) {
  return commonRequest('/hse/weather/getWeekWeather', data)
}

// 정산대사 api 호출
export function commonReconcilePayPoint(data) {
  console.log('commonReconcilePayPoint executed! ', data)
  return commonRequest('/hse/kakaopay/ReconcilePayPoint', data)
}

// 거래조회 api 호출
export function commonSearchTransaction(data) {
  console.log('commonSearchTransaction executed! ', data)
  return commonRequest('/hse/kakaopay/SearchTransaction', data)
}

//파이어베이스 알림 전송
export function commonSendFirebase(data) {
  return commonRequest('/hse/common/sendFirebase', data)
}

//함수호출함수 (단건조회)
export function selectFunction(data) {
  return commonRequest('/hse/common/selectFunction', data)
}

// 태풍) 정해진일자와 시간의 기상정보
export function commonGetTypnWeather(data) {
  return commonRequest('/hse/weather/getDateWeather', data)
}

export function nullToEmpty(data) {
  if (data === null) {
    return ''
  } else {
    return data
  }
}

//다국어 번역
export function chatbotTranslateLn(data) {
  return commonRequest('/hse/common/chatbotTranslateLn', data)
}


// llm호출
export function commonLLMservice(data) {

  return commonRequest('/hse/llm/chatbot', data)
  
}




/*
2025.07.14김현재 작성
시스템관리 -> 메뉴관리에서 조회되는 메뉴 리스트 조회
운영관리 -> 화면별 사용자 IP권한 관리 -> 우측 그리드 추가버튼 눌렀을때 출력되는 팝업 데이터를 조회할때 호출한다.
*/

export function getMenuList() {
  let address = ''

  if (import.meta.env.MODE === 'prod') {
    //운영일때
    address = `https://xbuilder.hd.com/hiway/menus/apps/XX08`
  } else {
    //개발일때
    address = `http://xbuilder-dev.hd.com:49028/hiway/menus/apps/XX08`
  }
  if (isUseAPI()) {
    return request({
      url: address,
      method: 'get',
    })
  }
}

// 운영서버 API 테스트
export function commonApiTest(data) {
  return commonRequest('/hse/common/apiTestPost', data)
}
