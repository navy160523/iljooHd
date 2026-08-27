<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : 산재정보 등록/현황  등록(일반)-->
<script setup>
import { ref, reactive, onMounted, watch, readonly } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { commonRequest } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import RealGrid from '@/components/RealGrid.vue'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonUploadFilesApi,
} from '@hiway/api/commonApi'
import dayjs from 'dayjs'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { value } from 'lodash-es'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import AcdtPopup from '@/components/popup/AcdtPopup.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import { commonLogExecuteApi } from '@hiway/api/commonApi'
import { useLogsStore } from '@hiway/stores/logs'

import _ from 'lodash'
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['savedGeneral'])
const dialog = ref(false)
const grdPopUp = ref(null)
const popEmp = ref(null)
const acdtPopupRef = ref(null)
const userStore = useUserStore()
const readOnlyValue = reactive({
  CHECKBOX1: true, //근골격계 체크박스 readonly
  CHECKBOX2: true, //진폐 체크박스 readonly
})

const checkBoxValue = reactive({
  CHECKBOX1: 'N',
  CHECKBOX2: 'N',
})

const codeList = reactive({
  SANGBN: [], //산재구분
  REQGBN: [], //신청구분
  YOGBN: [], //요양구분
  SJE_TYPE_CD: [], //?
  INJURYPART: [], //상해부위
  INJURYTYPE: [], //상해종류
  GAINUM: [], //가입번호
})

// 데이터 바인딩

const ResData = reactive({
  data: {
    SANGBN: '',
  },
})

//일반산재 필드
const generalInAccField = reactive({
  EMP_NM: '', //재해자 성명
  EMPLNO: '', //재해자 사번
  DEPT_CD: '', //재해자부서코드
  DEPT_NM: '', //재해자부서
  BSNS_CD: '', //재해자사업부코드
  BSNS_NM: '', //재해자사업부
  SANGBN: '', //산재구분
  REQGBN: '', //신청구분
  OCCURDATE: '', //재해일시
  OCCURTIME: '', //재해시간
  SAGOTYPE: '', //사고형태
  SAGOTYPE_NM1: '', //사고형태 이름1
  SAGOTYPE_NM2: '', //사고형태 이름2
  SAGOTYPE_NM3: '', //사고형태 이름3
  INJURYTYPE: '', //상해종류
  INJURYPART: '', //상해부위
  REG_NO: '', //주민번호
  ADDR: '', //주소
})

//팝업 오픈
const empPopupOpen = () => {
  popEmp.value.openPopup({
    EMP_NM: generalInAccField.EMP_NM,
    DISABLE: ['전체', '사내협력사', '단기공사', '기타'],
    readonly: true,
    FLAG: 'Y',
    SANJE: true,
  })
}

const acdtOpen = () => {
  acdtPopupRef.value.openPopup()
}

//  조치자 셀렉트 이벤트

const openPopup = () => {
  Promise.all([
    getCodeList('HHIB250030'), //0
    getCodeList('HHIB250010'), //1
    getCodeList('HHIB250020'), //2

    getCodeList('HHIB080'), //3

    commonSearchApi({
      queryId: 'SAFAG0010_SEARCH_COMBO_02',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }), //4

    commonSearchApi({
      queryId: 'SAFAG0010_SEARCH_COMBO_05',
      param: { CMPNY_DIV: userStore.cmpnyDiv, CODE: 'B030' },
    }), //5

    commonSearchApi({
      queryId: 'SAFAG0010_SEARCH_COMBO_04',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }), // 6
  ]).then((res) => {
    codeList.SANGBN = res[0].ORESULT_CUR.filter((x) => x.TXT !== '진폐') //산재구분
    codeList.REQGBN = res[1].ORESULT_CUR //신청구분
    codeList.YOGBN = res[2].ORESULT_CUR //요양구분
    codeList.SJE_TYPE_CD = res[3].ORESULT_CUR //
    codeList.INJURYPART = res[4].ORESULT_CUR //상해부위
    codeList.INJURYTYPE = res[5].ORESULT_CUR //상해종류
    codeList.GAINUM = res[6].ORESULT_CUR //가입번호
    generalInAccField.REQGBN = '4'
    console.log('산재구분 SANGBN', codeList.SANGBN)
    console.log('신청구분 REQGBN', codeList.REQGBN)
    console.log('요양구분 YOGBN', codeList.YOGBN)
    console.log('상해부위 INJURYPART', codeList.INJURYPART)
    console.log('상해종류 INJURYTYPE', codeList.INJURYTYPE)
    console.log('가입번호 GAINUM', codeList.GAINUM)
  })
  dialog.value = true
}

// 저장
const mainCheck = () => {
  if (!generalInAccField.EMP_NM) {
    Message.warn(t('재해자는 필수입력값 입니다.'))
    return false
  } else if (!generalInAccField.SANGBN) {
    Message.warn(t('산재구분은 필수입력값 입니다.'))
    return false
  } else if (!generalInAccField.OCCURDATE) {
    Message.warn(t('재해일시는 필수입력값 입력입니다.'))
    return false
  }

  return true
}

const mainSaveData = () => {
  let saveParam = []

  let saveData = {
    CMPNY_DIV: generalInAccField.CMPNY_DIV,
    SANNO: generalInAccField.SANNO,
    REQGBN: '4',
    YOGBN: '0',
    SANGBN: checkBoxValue.CHECKBOX2 === 'Y' ? 'Z' : generalInAccField.SANGBN, //진폐에 체크하면 Z로 아니면 A로
    SAGONO: generalInAccField.SAGONO,
    EMPLNO: generalInAccField.EMP_NO,
    FILENUM: generalInAccField.FILENUM,
    GAINUM: '01',
    OCCURDATE: generalInAccField.OCCURDATE,
    OCCURTIME: generalInAccField.OCCURTIME,
    SAGOTYPE: generalInAccField.SAGOTYPE,
    INJURYTYPE: generalInAccField.INJURYTYPE,
    INJURYPART: generalInAccField.INJURYPART,
    REQDTE: generalInAccField.REQDTE,
    REQEMP: generalInAccField.REQEMP,
    SANOK: generalInAccField.SANOK,
    OKDTE: generalInAccField.OKDTE,
    HUDTE: generalInAccField.HUDTE,
    BOKDTE: generalInAccField.BOKDTE,
    ENDDTE: generalInAccField.ENDDTE,
    GRADE: generalInAccField.GRADE,
    GRADEDTE: generalInAccField.GRADEDTE,
    HAPDTE: generalInAccField.HAPDTE,
    HUDAY: '',
    HAPAMT: generalInAccField.HAPAMT,
    SALARY: generalInAccField.SALARY,
    SALARYDTE: generalInAccField.SALARYDTE,
    TARGETDTE: generalInAccField.TARGETDTE,
    TELNO1: generalInAccField.TELNO1,
    TELNO2: generalInAccField.TELNO2,
    TELGBN: generalInAccField.TELGBN,
    ORGBELNR: generalInAccField.ORGBELNR,
    ORGBELNRDTE: generalInAccField.ORGBELNRDTE,
    BANK: generalInAccField.BANK,
    APPROVEDTE: generalInAccField.APPROVEDTE,
    INGAMDTE: generalInAccField.INGAMDTE,
    RECEIPTDTE: generalInAccField.RECEIPTDTE,
    HAP_STATUS: generalInAccField.HAP_STATUS,
    HAPBIGO: generalInAccField.HAPBIGO,
    FILE_ID: generalInAccField.FILE_ID,
    STATUS: generalInAccField.SANGBN === 'N' ? 'C' : '', //산재구분이 난청이면 승인으로, 아니면 빈값으로
    SANGBYUNG: generalInAccField.SANGBYUNG,
    SAGOLOC: generalInAccField.SAGOLOC,
    SAGOGAEYO: generalInAccField.SAGOGAEYO,
    BIGO: generalInAccField.BIGO,
    ADD_DESC: generalInAccField.ADD_DESC,
    SJE_TYPE_CD: generalInAccField.SJE_TYPE_CD,
    SEND_YN: generalInAccField.SEND_YN,
    SAVE_YN: generalInAccField.SAVE_YN,
    USER_ID: userStore.userId,
    IP_ADDRESS: generalInAccField.IP_ADDRESS,
    P_SANNO: generalInAccField.P_SANNO,
    SAGO_CMPNY_DIV: generalInAccField.SAGO_CMPNY_DIV,
    SALARY_CORRECT_YN: generalInAccField.SALARY_CORRECT_YN,
  }
  saveParam.push(saveData)
  let params = {
    userStore: userStore,
    params: saveData,
    mgs: '등록(일반) 저장했습니다.',
    crudGbn: 'C', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
  return commonExecuteApi({ queryId: 'SAFAG0010_SAVE_01', list: saveParam })
}

const afterSave = (res) => {
  //등록(일반)에서 저장하고 저장된 데이터를 다시 조회해서 그리드에 뿌려줌
  //이렇게 안하면 워낙 누락된 데이터가 많기도하고, 어떤 버그가 생길지 몰라서 재조회 해서 뿌려줌

  console.log('저장하고 나오는 데이터', res)
  let param = {
    CMPNY_DIV: res.list[0].CMPNY_DIV,
    STATUS: '',
    DATE_YN: 'N',
    FROM: '',
    TO: '',
    SANNO: res.list[0].OUT_RES_SANNO,
    EMP_NO: res.list[0].EMPLNO,
    SANGBN: '',
    SANOK: '',
    SAGOTYPE: '',
    BSNS_CD: '',
    DEPT_CD: '',
    NAME: '',
  }
  commonSearchApi({
    queryId: 'SAFAG0010_SEARCH01',
    param: param,
  }).then((res) => {
    emit('savedGeneral', res.ORESULT_CUR[0])
    closePopup()
  })
  //generalInAccField.SANNO = res.list[0].OUT_RES_SANNO
  //let emitObj = _.cloneDeep(generalInAccField)
  //console.log('등록(일반) emit으로 올려주는 데이터', emitObj)
  //
  //
}

const closePopup = () => {
  for (let i in generalInAccField) {
    generalInAccField[i] = ''
  }
  readOnlyValue.CHECKBOX1 = true //근골격계 체크박스 비활성화
  readOnlyValue.CHECKBOX2 = true //진폐 체크박스 비활성화
  dialog.value = false
}

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(mainCheck)
      .setQuery(mainSaveData)
      .setAfter(afterSave)
      .run()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

const selectedArr = (row) => {
  if (row) {
    generalInAccField.SAGOTYPE = row[2].ALL_SYS_CD
    generalInAccField.SAGOTYPE_NM1 = row[0].TXT
    generalInAccField.SAGOTYPE_NM2 = row[1].TXT
    generalInAccField.SAGOTYPE_NM3 = row[2].TXT
  }
}

const selected = (row) => {
  if (row) {
    console.log('선택', row)
    generalInAccField.CMPNY_DIV = row.CMPNY_DIV
    generalInAccField.BSNS_CD = row.BSNS_CD
    generalInAccField.BSNS_NM = row.BSNS_NM
    generalInAccField.TELNO1 = row.HND_PHN
    generalInAccField.ASGN_CD = row.ASGN_CD
    generalInAccField.ASGN_NM = row.ASGN_NM
    generalInAccField.DEPT_CD = row.DEPT_CD
    generalInAccField.DEPT_NM = row.DEPT_NM
    generalInAccField.HLD_OFFI_GBN = row.HLD_OFFI_GBN
    generalInAccField.EMP_NO = row.EMP_NO
    generalInAccField.EMP_NM = row.EMP_NM
    generalInAccField.ADDR = row.ADDR1
  }
}

// 산재구분이  난청으로 바뀌면
watch(
  () => generalInAccField.SANGBN,
  (newValue) => {
    if (newValue === 'N') {
      console.log('난청', newValue)
      readOnlyValue.CHECKBOX1 = true
      readOnlyValue.CHECKBOX2 = true
      checkBoxValue.CHECKBOX1 = 'N'
      checkBoxValue.CHECKBOX2 = 'N'
      generalInAccField.REQGBN = '2' //신청구분
      generalInAccField.OCCURDATE = dayjs().format('YYYY-MM-DD') //재해일시
      generalInAccField.OCCURTIME =
        dayjs().$H.toString().padStart(2, '0') +
        ':' +
        dayjs().$m.toString().padStart(2, '0') //재해시간
      generalInAccField.YOGBN = '0' //요양구분
      generalInAccField.INJURYPART = 'HHIB020AE' //상해부위 머리-귀
      generalInAccField.INJURYTYPE = 'HHIB030240' //상해종류 청력장애
      generalInAccField.SAGOTYPE = 'HHIB010BFZ' //사고형태코드
      generalInAccField.SAGOTYPE_NM1 = '비사고'
      generalInAccField.SAGOTYPE_NM2 = '질환성'
      generalInAccField.SAGOTYPE_NM3 = '기타'
      generalInAccField.SJE_TYPE_CD = '02'
      generalInAccField.SAGOGAEYO =
        '당사 신검시 난청으로 확인된 내용으로 산재 신청함' //사고개요

      // generalInAccField.REQGBN = '2' //신청구분
      // generalInAccField.YOGBN = '0' //요양구분

      // generalInAccField.OCCURDATE = dayjs().format('YYYY-MM-DD') //재해일시

      // generalInAccField.INJURYTYPE = 'HHIB030240' //상해종류
      // generalInAccField.INJURYPART = 'HHIB020AE' //상해부위
      // generalInAccField.SAGOGAEYO =
      //   '당사 신검시 난청으로 확인된 내용으로 산재 신청함' //사고개요
    }
    //산재구분이 일반사고로 변경되면 우측 체크박스 활성화
    else if (newValue === 'A') {
      readOnlyValue.CHECKBOX1 = false
      readOnlyValue.CHECKBOX2 = false
    } else {
      readOnlyValue.CHECKBOX1 = true
      readOnlyValue.CHECKBOX2 = true
      checkBoxValue.CHECKBOX1 = 'N'
      checkBoxValue.CHECKBOX2 = 'N'
      for (let i in generalInAccField) {
        generalInAccField[i] = ''
      }
    }
  }
)

//사고형태 변경 감지
watch(
  () => generalInAccField.SAGOTYPE,
  (newValue) => {
    //사고형태가 비작업성,근골격계일경우
    if (newValue.includes('HHIB010BA')) {
      generalInAccField.SANGBN = 'A' //산재구분 -일반사고
      generalInAccField.REQGBN = '2' //신청구분 - 비사고성
      generalInAccField.OCCURDATE = dayjs().format('YYYY-MM-DD') //재해일시
      if (checkBoxValue.CHECKBOX1 === 'N' && checkBoxValue.CHECKBOX2 === 'N') {
        //근골,진폐 체크했을때는 재해시간이 들어가지 않도록
        generalInAccField.OCCURTIME =
          dayjs().$H.toString().padStart(2, '0') +
          ':' +
          dayjs().$m.toString().padStart(2, '0') //재해시간
      }
      generalInAccField.SAGOTYPE = 'HHIB010BAC' //사고형태코드
      generalInAccField.SAGOTYPE_NM1 = '비사고' //사고형태이름1
      generalInAccField.SAGOTYPE_NM2 = '무리한 동작(근골격계)' //사고형태이름2
      generalInAccField.SAGOTYPE_NM3 =
        '비사고,근골격계, 업무누적으로 인한 신체 무리' //사고형태이름3
      generalInAccField.INJURYTYPE = 'HHIB030260' //상해종류-인대/근육/연골 등 손상
      generalInAccField.INJURYPART = 'HHIB020BJ' //상해부위 몸체-어깨
      generalInAccField.SAGOGAEYO =
        '오랜기간 반복적인 작업으로 인해 양측 어깨 外에 통증을  느껴 산재 신청함.' //사고개요
    }
    //사고형태가 비작업성 - 질환성 - 진폐인경우
    if (newValue === 'HHIB010BFC') {
      generalInAccField.SANGBN = 'A' //산재구분 -일반사고
      generalInAccField.REQGBN = '2' //신청구분 - 비사고성
      generalInAccField.OCCURDATE = dayjs().format('YYYY-MM-DD') //재해일시
      if (checkBoxValue.CHECKBOX1 === 'N' && checkBoxValue.CHECKBOX2 === 'N') {
        //근골,진폐 체크했을때는 재해시간이 들어가지 않도록
        generalInAccField.OCCURTIME =
          dayjs().$H.toString().padStart(2, '0') +
          ':' +
          dayjs().$m.toString().padStart(2, '0') //재해시간
      }
      generalInAccField.SAGOTYPE = 'HHIB010BFC' //사고형태코드
      generalInAccField.SAGOTYPE_NM1 = '비사고' //사고형태이름1
      generalInAccField.SAGOTYPE_NM2 = '질환성' //사고형태이름2
      generalInAccField.SAGOTYPE_NM3 = '진폐' //사고형태이름3
      generalInAccField.INJURYTYPE = 'HHIB030990' //상해종류-기타
      generalInAccField.INJURYPART = 'HHIB020ZZ' //상해부위 기타부위
      generalInAccField.SAGOGAEYO = '진폐증으로 인해 통증을 느껴 산재 신청함. ' //사고개요
    }
  }
)

//근골격계를 체크했을경우
watch(
  () => checkBoxValue.CHECKBOX1,
  (newValue, oldVvalue) => {
    console.log('근골격계', newValue)
    if (newValue === 'Y') {
      checkBoxValue.CHECKBOX2 = 'N'
      generalInAccField.SANGBN = 'A' //산재구분 -일반사고
      generalInAccField.REQGBN = '2' //신청구분 - 비사고성
      generalInAccField.OCCURDATE = dayjs().format('YYYY-MM-DD') //재해일시
      generalInAccField.SAGOTYPE = 'HHIB010BAC' //사고형태코드
      generalInAccField.SAGOTYPE_NM1 = '비사고' //사고형태이름1
      generalInAccField.SAGOTYPE_NM2 = '무리한 동작(근골격계)' //사고형태이름2
      generalInAccField.SAGOTYPE_NM3 =
        '비사고,근골격계, 업무누적으로 인한 신체 무리' //사고형태이름3
      generalInAccField.INJURYTYPE = 'HHIB030260' //상해종류-인대/근육/연골 등 손상
      generalInAccField.INJURYPART = 'HHIB020BJ' //상해부위 몸체-어깨
      generalInAccField.SAGOGAEYO =
        '오랜기간 반복적인 작업으로 인해 양측 어깨 外에 통증을  느껴 산재 신청함.' //사고개요
    }
  }
)

watch(
  () => checkBoxValue.CHECKBOX2,
  (newValue, oldValue) => {
    console.log('진폐', newValue)
    if (newValue === 'Y') {
      checkBoxValue.CHECKBOX1 = 'N'
      generalInAccField.SANGBN = 'A' //산재구분 -일반사고
      generalInAccField.REQGBN = '2' //신청구분 - 비사고성
      generalInAccField.OCCURDATE = dayjs().format('YYYY-MM-DD') //재해일시
      generalInAccField.SAGOTYPE = 'HHIB010BFC' //사고형태코드
      generalInAccField.SAGOTYPE_NM1 = '비사고' //사고형태이름1
      generalInAccField.SAGOTYPE_NM2 = '질환성' //사고형태이름2
      generalInAccField.SAGOTYPE_NM3 = '진폐' //사고형태이름3
      generalInAccField.INJURYTYPE = 'HHIB030990' //상해종류-기타
      generalInAccField.INJURYPART = 'HHIB020ZZ' //상해부위 기타부위
      generalInAccField.SAGOGAEYO = '진폐증으로 인해 통증을 느껴 산재 신청함. ' //사고개요
    }
  }
)

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1440"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <div class="title-bar" @mousedown="startDragging">일반 산재시</div>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-3 pb-0">
        <IMenuTitle
          :use-permission="false"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-input
              :label="$t('재해자')"
              v-model="generalInAccField.EMP_NM"
              append-inner-icon="mdi-magnify"
              @click:appendInner="empPopupOpen"
              @keypress.enter="empPopupOpen"
              placeholder="이름"
              width="200px"
              top-label
              required
            >
            </i-input>
            <i-input
              v-model="generalInAccField.EMP_NO"
              placeholder="사번"
              width="200px"
              class="mt-5"
              readonly
            >
            </i-input>
          </div>
          <div class="d-flex mt-2">
            <i-select
              :label="$t('산재구분')"
              v-model="generalInAccField.SANGBN"
              :items="codeList.SANGBN"
              item-value="COD"
              item-title="TXT"
              top-label
              width="300px"
              required
            >
            </i-select>
            <i-select
              :label="$t('신청구분')"
              v-model="generalInAccField.REQGBN"
              :items="codeList.REQGBN"
              item-value="COD"
              item-title="TXT"
              width="300px"
              top-label
            >
            </i-select>

            <v-checkbox
              label="근골격계"
              class="mt-5"
              :disabled="readOnlyValue.CHECKBOX1"
              v-model="checkBoxValue.CHECKBOX1"
              true-value="Y"
              false-value="N"
            ></v-checkbox>
            <span class="mx-3"></span>
            <v-checkbox
              label="진폐"
              class="mt-5"
              :disabled="readOnlyValue.CHECKBOX2"
              v-model="checkBoxValue.CHECKBOX2"
              true-value="Y"
              false-value="N"
            ></v-checkbox>
          </div>
          <div class="d-flex mt-2">
            <i-input
              :label="$t('재해일시')"
              v-model="generalInAccField.OCCURDATE"
              type="date"
              top-label
              width="150px"
              required
            >
            </i-input>
            <i-input
              v-model="generalInAccField.OCCURTIME"
              width="150px"
              class="mt-5"
              type="time"
            >
            </i-input>
          </div>
          <div class="d-flex mt-2">
            <i-input
              :label="$t('사고형태')"
              v-model="generalInAccField.SAGOTYPE_NM1"
              @click="acdtOpen"
              readonly
              append-inner-icon="mdi-magnify"
              class="mr-2"
              top-label
              width="200px"
            >
            </i-input>
            <i-input
              v-model="generalInAccField.SAGOTYPE_NM2"
              readonly
              class="mr-2 mt-5"
              width="200px"
            >
            </i-input>
            <i-input
              v-model="generalInAccField.SAGOTYPE_NM3"
              width="300px"
              class="mt-5"
              readonly
            >
            </i-input>
          </div>
          <div class="d-flex mt-2">
            <i-select
              :label="$t('상해종류')"
              top-label
              v-model="generalInAccField.INJURYTYPE"
              :items="codeList.INJURYTYPE"
              item-value="COD"
              item-title="TXT"
              width="200px"
            >
            </i-select>
            <i-select
              :label="$t('상해부위')"
              v-model="generalInAccField.INJURYPART"
              :items="codeList.INJURYPART"
              item-value="COD"
              item-title="TXT"
              width="200px"
              top-label
            >
            </i-select>
          </div>
          <div class="d-flex mt-2">
            <i-textarea
              :label="$t('사고개요')"
              v-model="generalInAccField.SAGOGAEYO"
              width="100%"
            >
            </i-textarea>
          </div>
        </v-sheet>
      </v-card-text>
    </v-card>
    <AcdtPopup @selectedArr="selectedArr" ref="acdtPopupRef" />
    <EmpPopup @selected="selected" ref="popEmp" />
  </v-dialog>
</template>

<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
