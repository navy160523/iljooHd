<!--
  화면명 : 업무상질병 신청 자료등록(현업부서용)
  화면개요 : 업무상질병 신청 자료등록(현업부서용)
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { isEmpty } from '@/@core/utils'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonRequest2, commonSendApi } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { commonDownloadFilesApi, commonDeleteAllFilesApi } from "@hiway/api/commonFileApi"
import IGridTitle from '@/components/IGridTitle.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import RealGrid from '@/components/RealGrid.vue'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import _ from 'lodash'
import OZReport from '@/components/OZReport.vue'
import HLTJB0010Popup03Popup01 from '@/pages/100_health/HLT_J/HLTJB0010Popup03Popup01.vue'
import HLTJB0010Popup03Popup02 from '@/pages/100_health/HLT_J/HLTJB0010Popup03Popup02.vue'

const emit = defineEmits(['after-search', 'all-register', 'delete'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)
const fileUploadPopup = ref(null)
const hltjb0010Popup03Popup01 = ref(null)
const hltjb0010Popup03Popup02 = ref(null)
const selectGubun = ref('')
const type = ref('') // 현업부서용 dept, 인사부서용 hr
const popupTitle = ref('자료등록(현업부서용)')
const showOz = ref(false)
const reportName = ref('/manage/hse/HLTJB0010_01.ozr')
const reportParam = ref([])
const oneFile = ref(false)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, // 회사구분(pk)
  EMP_NO: '', // 사번(pk)
  EMP_NM: '', // 이름
  BIRTH_DAY: '', // 생일
  HLD_OFFI_GBN: '', // 재직구분
  BSNS_NM: '', // 사업부
  DEPT_NM: '', // 부서
  ASGN_NM: '', // 과
  STD_DUTY_NM: '', // 직종
  JOB_TIT_NM: '', // 직위
  COM_ENT_DATE: '', // 입사일자
  RETI_DATE: '', // 휴,퇴직일
  APPLI_GUBUN: '', // 신청구분
  APPLI_GUBUN_NM: '', // 신청구분명
  HOSPITAL_CODE: '', // 진단기관
  HOSPITAL_NM: '', // 진단기관명
  BODY1_CODE: '', // 신체부위1
  BODY1_NM: '', //신체부위1 명
  BODY2_CODE: '', // 신체부위2
  BODY2_NM: '', //신체부위2 명
  DIAGNOSIS_DATE: '', // 진단일
  DISEASE_CODE: '', // 상병코드 (PK)
  DISEASE_NM: '', // 상병명
  APPLI_DATE: '', // 진정일(pk)
  INCIDENT_CODE: '', // 발생경위 코드
  INCIDENT_NM: '', // 발생경위
  NOTIFY_FILE_ID: '', // 사실통지서
  WORK_STANDARD_NM: '', // 작업표준(담당업무)
  WORK_EVAL: '', // 작업력 평가
  WORK_YEAR: '',
  SEX: '', // 성별
  SAVE_YN: ''
})

const codeList = reactive({
  HLD_OFFI_GBN: [
    { COD: '1', TXT: '재직' },
    { COD: '2', TXT: '휴직' },
    { COD: '3', TXT: '퇴사' },
    { COD: '4', TXT: '군입영' },
  ]
})


//그리드 속성셋팅 
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: false }, },
  keys : [], 
  fields : [ 
    { fieldName: 'GUBUN', width: '120', dataType: 'text', header: { text: t('구분') }},
    { fieldName: 'POLICYHOLDER', width: '60', dataType: 'text', header: { text: t('업로드') },
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          let btnBackColor = cell.value == '완료' ? '#1eaf1e' : '#1a40c7'
          var str = 
          `<button 
              class="v-btn" 
              style="color: #fff; background: ${btnBackColor}; padding: 4px;"
            >${cell.value}</button>`;
          return str;
        },
      }
    },
    { fieldName: 'DOWNLOAD', width: '60', dataType: 'text', header: { text: t('다운로드') },
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          var str = 
          `<button 
              class="v-btn" 
              style="color: #fff; background: #1a40c7; padding: 4px;"
            >다운로드</button>`;
          return str;
        },
      }
    },
    { fieldName: 'INSERT_DATE', width: '100', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', header: { text: t('업로드 날짜') }},
    { fieldName: 'DELETE_BTN', width: '60', dataType: 'text', header: { text: t('삭제') },
      renderer: {
        type: "html",
        callback: function (grid, cell, w, h) {
          var str = 
          `<button 
              class="v-btn" 
              style="color: #fff; background: #e52b2b; padding: 4px;"
            >삭제</button>`;
          return str;
        },
      }
    },
    
    // 안보이는거
    { fieldName: 'FILE_ID', dataType: 'text', header: { text: t('파일 아이디') },visible: false, },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사구분') },visible: false, },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

// 팝업 OPEN
const openPopup = (param, buttonType) => {
  grdMain.value.getDataProvider().setRows()
  type.value = buttonType
  if(type.value == 'dept') {
    popupTitle.value = '자료등록(현업부서용)'
  } else {
    popupTitle.value = '자료등록(인사부서용)'
  }
  if(!isEmpty(param)) {
    for (let key in param) {
      if (searchParams.hasOwnProperty(key)) {
        if(key === 'DIAGNOSIS_DATE' && !isEmpty(param.DIAGNOSIS_DATE)) {
          searchParams.DIAGNOSIS_DATE = dayjs(param.DIAGNOSIS_DATE).format('YYYY-MM-DD')
        } else if (key === 'APPLI_DATE' && !isEmpty(param.APPLI_DATE)) {
          searchParams.APPLI_DATE = dayjs(param.APPLI_DATE).format('YYYYMMDD')
        } else if (key === 'BIRTH_DAY' && !isEmpty(param.BIRTH_DAY)) {
          searchParams.BIRTH_DAY = dayjs(param.BIRTH_DAY).format('YYYY-MM-DD')
        } else if (key === 'COM_ENT_DATE' && !isEmpty(param.COM_ENT_DATE)) {
          searchParams.COM_ENT_DATE = dayjs(param.COM_ENT_DATE).format('YYYY-MM-DD')
        } else if (key === 'RETI_DATE' && !isEmpty(param.RETI_DATE)) {
          searchParams.RETI_DATE = dayjs(param.RETI_DATE).format('YYYY-MM-DD')
        } else if (key === 'HLD_OFFI_GBN') {
          let hldOffiGbn = codeList.HLD_OFFI_GBN.filter(item => item.COD === param.HLD_OFFI_GBN)
          searchParams.HLD_OFFI_GBN = !isEmpty(hldOffiGbn) ? hldOffiGbn[0].TXT : ''
        } else {
          searchParams[key] = param[key]
        }
      }
    }
    searchParams.EMP_NM = param.KOR_NM
    searchParams.SAVE_YN = 'Y'
    onButtonsClick({ id: 'btnSearch' })
  } else {
    searchParams.SAVE_YN = 'N'
    searchParams.CMPNY_DIV = userStore.cmpnyDiv
  }
  dialog.value = true
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .showMessage(true)
      .run()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnClose') {
    closePopup()
  } 
}


//  조회
const searchData = () => {
  let param = _.cloneDeep(searchParams)
  param.DIAGNOSIS_DATE = dayjs(param.DIAGNOSIS_DATE).format('YYYYMMDD')
  if(type.value == 'dept') {
    return commonSearchApi({ queryId: 'HLTJB0010_SEARCH_03', param: param })
  } else if(type.value == 'hr') {
    return commonSearchApi({ queryId: 'HLTJB0010_SEARCH_04', param: param })
  }
}

// 조회 후
const afterSearch = (res) => {
  // 현업부서용 자료는 전부 등록해야함
  // 2025.09.18 하나만 등록해도됨
  if(type.value == 'dept') {
    let complete = false
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)


    // 모든 자료가 등록되었을 시 메인에 버튼을 완료로 바꾼다.
    for(let result of res.ORESULT_CUR) {
      if(!isEmpty(result.INSERT_DATE)) {
        complete = true
        break
      }
    }
    if(complete) {
      emit('all-register')
    } else {
      emit('delete')
    }
  }else {
    // 인사부서용 자료는 하나만 등록해도됨
    let complete = false
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)


    // 모든 자료가 등록되었을 시 메인에 버튼을 완료로 바꾼다.
    for(let result of res.ORESULT_CUR) {
      if(!isEmpty(result.INSERT_DATE)) {
        complete = true
        break
      }
    }
    if(complete) {
      emit('all-register')
    } else {
      emit('delete')
    }
  }
}

// 저장 전
const beforeSave = () => {
  if(searchParams.SAVE_YN == 'N') {
    if(!isEmpty(grdMain.value.getDataProvider().getJsonRows(0,-1).filter(item => 
      item.CMPNY_DIV === searchParams.CMPNY_DIV &&
      item.EMP_NO === searchParams.EMP_NO &&
      item.DISEASE_CODE === searchParams.DISEASE_CODE &&
      item.APPLI_DATE === searchParams.APPLI_DATE))) {
      return Message.warn(t('이미 존재하는 질병, 진단일 건수입니다.'))
    }
  }
  // validation 체크
  if (isEmpty(searchParams.EMP_NO)) {
    return Message.warn(t('신청인 정보가 없습니다.'))
  } else if (isEmpty(searchParams.CMPNY_DIV)) {
    return Message.warn(t('회사구분은 필수 입력입니다.'))
  } else if (isEmpty(searchParams.DISEASE_CODE)) {
    return Message.warn(t('상병명은 필수 입력입니다.'))
  } else if (isEmpty(searchParams.APPLI_DATE)) {
    return Message.warn(t('신청일은 필수 입력입니다.'))
  } else if (isEmpty(searchParams.HOSPITAL_CODE)) {
    return Message.warn(t('진단기관은 필수 입력입니다.'))
  } else if (isEmpty(searchParams.DIAGNOSIS_DATE)) {
    return Message.warn(t('진단일은 필수 입력입니다.'))
  }

  return true
}

const saveData = () => {
  let saveParams = _.cloneDeep(searchParams)

  saveParams.APPLI_DATE = searchParams.APPLI_DATE.replaceAll('-', '')
  saveParams.DIAGNOSIS_DATE = searchParams.DIAGNOSIS_DATE.replaceAll('-', '')  

  return commonExecuteApi({ queryId : 'HLTJB0010_SAVE_01', list: [saveParams] })
}

const afterSaveData = () => {
  Message.success(t('성공적으로 저장되었습니다'))
  getDisease()
  searchParams.SAVE_YN = 'Y'
}

const clearParam = () => {
  for (let key in searchParams) {
    if (searchParams.hasOwnProperty(key)) {
      searchParams[key] = ''
    } 
  }
}

/* ********** 닫기 ********** */
const closePopup = () => {
  clearParam()
  dialog.value = false
}

const onCellItemClicked = (grid, index, col) => {
  let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)
  
  if(col.target.className === 'v-btn' && col.column === 'POLICYHOLDER'){
    if(data.GUBUN == '보험가입자 의견서') {
      hltjb0010Popup03Popup01.value.openPopup( { ...searchParams, FILE_ID: data.FILE_ID})
    } else if (data.GUBUN == '사업주 조사서') {
      hltjb0010Popup03Popup02.value.openPopup( { ...searchParams, FILE_ID: data.FILE_ID})
    } else if (data.GUBUN == '기타자료') {
      selectGubun.value = data.GUBUN
      oneFile.value = false
      fileUploadPopup.value.openPopup(data.FILE_ID)
    } else {
      selectGubun.value = data.GUBUN
      oneFile.value = true
      fileUploadPopup.value.openPopup(data.FILE_ID)
    }
  } else if (col.target.className === 'v-btn' && col.column === 'DOWNLOAD'){
    if(data.POLICYHOLDER == '등록') {
      return Message.warn(t('파일이 존재하지 않습니다.'))  
    }
    
    // 보험가입자 의견서 선택 시 오즈리포트 실행
    if(data.GUBUN == '보험가입자 의견서') {
      print1()
    } else if (data.GUBUN == '사업주 조사서') {
      // 사업주 조사서 오즈리포트 실행
      print2()
    } else {
      if(isEmpty(data.FILE_ID)) {
        return Message.warn(t('파일이 존재하지 않습니다.'))
      }
      fileDownload(data.FILE_ID)
    }
  } else if (col.target.className === 'v-btn' && col.column === 'DELETE_BTN'){
    // 삭제
    if(data.POLICYHOLDER == '등록') {
      return Message.warn(t('파일이 존재하지 않습니다.'))  
    }

    let param = _.cloneDeep(searchParams)
    param.DIAGNOSIS_DATE = dayjs(param.DIAGNOSIS_DATE).format('YYYYMMDD')
    // 보험가입자 의견서 삭제
    if(data.GUBUN == '보험가입자 의견서') {  
      vm.$swal({ title: t('보험가입자 의견서를 삭제하시겠습니까?'), showCancelButton: true }).then((ck) => {
        if (ck.isConfirmed === true) {
          commonExecuteApi({ queryId : 'HLTJB0010_DELETE_04', list: [ param ] }).then(res => {
            Message.success(t('삭제되었습니다.'))
            onButtonsClick({ id : 'btnSearch' })
            emit('delete')
          })
        }
      })
    } else if (data.GUBUN == '사업주 조사서') {
      // 사업주 조사서 삭제
      vm.$swal({ title: t('사업주 조사서를 삭제하시겠습니까?'), showCancelButton: true }).then((ck) => {
        if (ck.isConfirmed === true) {
          commonExecuteApi({ queryId : 'HLTJB0010_DELETE_05', list: [ param ] }).then(res => {
            Message.success(t('삭제되었습니다.'))
            onButtonsClick({ id : 'btnSearch' })
            emit('delete')
          })
        }
      })
    } else {
      // 그 외
      if(isEmpty(data.FILE_ID)) {
        return Message.warn(t('파일이 존재하지 않습니다.'))
      }

      vm.$swal({ title: t(data.GUBUN + '를 삭제하시겠습니까?'), showCancelButton: true }).then((ck) => {
        if (ck.isConfirmed === true) {
          commonDeleteAllFilesApi([data]).then(res => {
            Message.success(t('삭제되었습니다.'))
            onButtonsClick({ id : 'btnSearch' })
            emit('delete')
          })
        }
      })
    }
  }
}

const fileDownload = async (fileId) => {
  let fileData = await commonSearchApi({ queryId: 'searchFile', param: { CMPNY_DIV: searchParams.CMPNY_DIV, FILE_ID: fileId }})

  for(let f of fileData.ORESULT_CUR) {
    commonDownloadFilesApi(f)
    .then((res) => {
      //2023.11.30 박용훈 백단에서 FileUtils.fileDownload 를 사용하는것으로 바꾸어서 변경함.
      const file = res.contentDisposition.split('fileName="')
      const blob = new Blob([res])
      const link = document.createElement("a")

      link.href = URL.createObjectURL(blob)

      //2023.11.30 박용훈 백단에서 FileUtils.fileDownload 를 사용하는것으로 바꾸어서 변경함.
      // 2023.12.08 박용훈 파일명을 다시 디코딩 해줘야함.
      link.download = decodeURI(file[1].replace('";', ""))
      link.click()
      URL.revokeObjectURL(link.href)
      Message.info(t('다운로드가 완료되었습니다.'))
    })
    .catch((e) => {
      // console.log('e', e)
    })
  }
}

// 보험가입자 의견서 출력
const print1 = () => {
  let workHistory = ''
  reportName.value = ref('/manage/hse/HLTJB0010_01.ozr')

  if(searchParams.HLD_OFFI_GBN == '재직') {
    workHistory = '계속 근무'
  } else if(searchParams.HLD_OFFI_GBN == '휴직') {
    workHistory = searchParams.RETI_DATE + ' 이후 휴직'
  } else {
    workHistory = searchParams.RETI_DATE + ' 퇴직'
  }
 
  reportParam.value = [
    'IN_CMPNY_DIV=' + searchParams.CMPNY_DIV,
    'IN_EMP_NO=' + searchParams.EMP_NO,
    'IN_DIAGNOSIS_DATE=' + dayjs(searchParams.DIAGNOSIS_DATE).format('YYYYMMDD'),
    'IN_HOSPITAL_CODE=' + searchParams.HOSPITAL_CODE,
    'IN_HOSPITAL_NM=' + searchParams.HOSPITAL_NM,
    'IN_EMP_NM=' + searchParams.EMP_NM,
    'IN_BIRTH_DAY=' + getHumanNumber(),
    'IN_COM_ENT_DATE=' + searchParams.COM_ENT_DATE,
    'IN_STD_DUTY_NM=' + searchParams.STD_DUTY_NM,
    'IN_WORK_HISTORY=' + workHistory,
    'IN_WORK_STANDARD_NM=' + searchParams.WORK_STANDARD_NM.replaceAll('<br>', ', '),
    'IN_DIAGNOSIS_DATE_PRINT=' + dayjs(searchParams.DIAGNOSIS_DATE).format('YYYY년 MM월 DD일'),
    'IN_TODAY=' + dayjs().format('YYYY년 MM월 DD일'),
  ]
  showOz.value = true
}

// 사업주 조사서 출력
const print2 = () => {
  reportName.value = ref('/manage/hse/HLTJB0010_02.ozr')
  reportParam.value = [
    'IN_CMPNY_DIV=' + searchParams.CMPNY_DIV,
    'IN_EMP_NO=' + searchParams.EMP_NO,
    'IN_DIAGNOSIS_DATE=' + dayjs(searchParams.DIAGNOSIS_DATE).format('YYYYMMDD'),
    'IN_HOSPITAL_CODE=' + searchParams.HOSPITAL_CODE,
    'IN_HOSPITAL_NM=' + searchParams.HOSPITAL_NM,
    'IN_EMP_NM=' + searchParams.EMP_NM,
    'IN_BIRTH_DAY=' + dayjs(searchParams.BIRTH_DAY).format('YYYY년 MM월 DD일'),
    'IN_AGE=' + getAge(),
    'IN_COM_ENT_DATE=' + dayjs(searchParams.COM_ENT_DATE).format('YYYY년 MM월 DD일'),
    'IN_JOB_TIT_NM=' + searchParams.JOB_TIT_NM,
    'IN_HLD_OFFI_GBN=' + searchParams.HLD_OFFI_GBN, 
    'IN_RETI_DATE=' + searchParams.HLD_OFFI_GBN == '재직'? ' ' : (isEmpty(searchParams.RETI_DATE) ? ' ' : searchParams.RETI_DATE),
    'IN_STD_DUTY_NM=' + searchParams.STD_DUTY_NM,
    'IN_WORK_DATE=' + getWorkDate(),
    'IN_TODAY=' + dayjs().format('YYYY년 MM월 DD일'),
  ]
  showOz.value = true
}

// 파일 업로드 이벤트
const uploaded = (val) => { 
  let param = _.cloneDeep(searchParams)
  param.DIAGNOSIS_DATE = dayjs(param.DIAGNOSIS_DATE).format('YYYYMMDD')
  if(selectGubun.value == '인사기록부') {
    param.HR_MEMO_FILE_ID = val.fileId
    searchParams.HR_MEMO_FILE_ID = val.fileId
    commonExecuteApi({ queryId : 'HLTJB0010_SAVE_10', list: [param] }).then(res => {
      Message.success(t('업로드 되었습니다.'))
    })
  } else if(selectGubun.value == '근태기록부') {
    param.HR_ATTEND_FILE_ID = val.fileId
    searchParams.HR_ATTEND_FILE_ID = val.fileId
    commonExecuteApi({ queryId : 'HLTJB0010_SAVE_11', list: [param] }).then(res => {
      Message.success(t('업로드 되었습니다.'))
    })
  } else if(selectGubun.value == '기타자료') {
    if(type.value == 'dept') {
      param.DEPT_REMARK_FILE_ID = val.fileId
      searchParams.DEPT_REMARK_FILE_ID = val.fileId
      commonExecuteApi({ queryId : 'HLTJB0010_SAVE_09', list: [param] }).then(res => {
        Message.success(t('업로드 되었습니다.'))
      })
    } else if(type.value == 'hr') {
      param.HR_REMARK_FILE_ID = val.fileId
      searchParams.HR_REMARK_FILE_ID = val.fileId
      commonExecuteApi({ queryId : 'HLTJB0010_SAVE_12', list: [param] }).then(res => {
        Message.success(t('업로드 되었습니다.'))
      })
    }
  }
}

const filePopupClosed = () => {
  onButtonsClick({ id : 'btnSearch' })
}

// 근무일수 계산
const getWorkDate = () => {
  const joinDate = dayjs(searchParams.COM_ENT_DATE, 'YYYY-MM-DD') // 입사일
  const resignDate = dayjs(searchParams.RETI_DATE || dayjs()) // 퇴직/휴직일
  // 총 근무 연수 계산
  const years = resignDate.diff(joinDate, 'year')
  // 남은 개월 수 계산
  const months = resignDate.diff(joinDate.add(years, 'year'), 'month')
  // 결과 문자열 반환
  return `${years}년 ${months}개월`
}

// 만 나이 구하기
const getAge = () => {
  // 생년월일을 dayjs 객체로 생성
  const birthDate = dayjs(searchParams.BIRTH_DAY, 'YYYY-MM-DD')
  // 현재 날짜를 dayjs 객체로 생성
  const currentDate = dayjs()
  // 전체 연도 차이 계산
  const fullYearDifference = currentDate.diff(birthDate, 'year')
  // 올해 생일 날짜 계산
  const thisYearsBirthday = birthDate.add(fullYearDifference, 'year')
  // 생일이 지났는지 여부 확인
  const hasBirthdayPassed = !currentDate.isBefore(thisYearsBirthday)
  // 실제 나이 계산
  return '' + (hasBirthdayPassed ? fullYearDifference : fullYearDifference - 1)
}

// 주민번호
const getHumanNumber = () => {
  if(isEmpty(searchParams.BIRTH_DAY)) return ''
  if(dayjs(searchParams.BIRTH_DAY).year() < 2000) {
    return dayjs(searchParams.BIRTH_DAY).format('YYYYMMDD').substring(2,8) + '-' + (searchParams.SEX == 'M' ? '1' : '2')
  } else {
    return dayjs(searchParams.BIRTH_DAY).format('YYYYMMDD').substring(2,8) + '-' + (searchParams.SEX == 'M' ? '3' : '4')
  }
}

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="800"
    height="400"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub" 
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>{{ popupTitle }}</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="content-area" style="height:250px;">
        <v-sheet class="searchArea flex-column">
          <RealGrid 
            ref="grdMain"
            style="height: 200px;"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellItemClicked="onCellItemClicked"
          />
        </v-sheet>
      </v-card-text>
    </v-card>
    <HLTJB0010Popup03Popup01 ref="hltjb0010Popup03Popup01" @after-search="onButtonsClick({ id: 'btnSearch' })"/>
    <HLTJB0010Popup03Popup02 ref="hltjb0010Popup03Popup02" @after-search="onButtonsClick({ id: 'btnSearch' })"/>
    <IUploadPopup 
      ref="fileUploadPopup" 
      :fileDan="oneFile"
      @uploaded="uploaded" 
      @closed="filePopupClosed"
    />
    <OZReport
      :showPop="showOz"
      :reportName="reportName"
      :params="reportParam" 
      @close="showOz = $event"
    ></OZReport>
  </v-dialog>
</template>

<style scoped lang="scss">
th {
  padding: 6px;
  border: 1px solid #ccc;
  background-color: #f4f5f9;
}

td {
  padding: 6px;
  font-weight: 400;
  border: 1px solid #ccc;
  text-align: center;
}

.no-click {
  pointer-events: none;
}
</style>
