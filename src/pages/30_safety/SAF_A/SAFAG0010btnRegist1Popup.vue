<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : 산재정보 등록/현황 등록(산재 )팝업  -->
<script setup>
import { ref, reactive, onMounted } from 'vue'
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
import queryFlowHelper from '@/utils/searchFlowHelper'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from '@hiway/stores/logs'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import { commonLogExecuteApi } from '@hiway/api/commonApi'
// import SAFAG0010GainumPopup from "@/pages/30_safety/SAF_A/SAFAG0010GainumPopup.vue"

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['selected', 'upDataRow'])
const dialog = ref(false)
const grdPopUp = ref(null)
const popEmp = ref()
const empPopup = ref(null)
const codeList = reactive({
  HLD_OFFI_GBN: [
    { COD: '1', TXT: '재직' },
    { COD: '2', TXT: '휴직' },
    { COD: '3', TXT: '퇴직' },
    { COD: '4', TXT: '입대' },
  ],
})
const userStore = useUserStore() //유저정보
const SAFAG0010GainumPopupRef = ref(null)
// 데이터 바인딩

const MainSearchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  DATE_YN: 'Y',
  FROM: dayjs().subtract(6, 'month').format('YYYY-MM-DD'),
  TO: dayjs().format('YYYY-MM-DD'),
  EMP_NO: '',
  NAME: '',
  USER_ID: userStore.userId,
  IP_ADDRESS: userStore.clientIp,
})

//const SaveData = reactive({})

const intCode = () => {
  Promise.all([
    getCodeList('HHIZ000'), //0
    commonSearchApi({
      queryId: 'SAFAG0010_SEARCH_COMBO_01',
      param: { CMPNY_DIV: MainSearchParams.CMPNY_DIV },
    }), // 1
    getCodeList('HHIB080'), //2
  ])
    .then((res) => {
      codeList.company = res[0].ORESULT_CUR.filter(
        (x) => x.COD === '100' || x.COD === 'HHI' || x.COD === '230'
      )

      grdPopUp.value.setBindingColumn(
        'SAGOTYPE',
        res[1].ORESULT_CUR,
        'COD',
        'TXT'
      )
      grdPopUp.value.setBindingColumn(
        'HLD_OFFI_GBN',
        codeList.HLD_OFFI_GBN,
        'COD',
        'TXT'
      )
      grdPopUp.value.setBindingColumn(
        'SJE_TYPE_CD',
        res[2].ORESULT_CUR,
        'COD',
        'TXT'
      )
    })
    .finally(() => {
      onButtonsClick({ id: 'btnSearch' })
    })
}

//오픈팝업

const openPopup = () => {
  //SaveData.param = ''
  intCode()
  dialog.value = true
}

//그리드 셋팅
const grdPopUpProps = reactive({
  gridViewOption: { checkBar: true },

  fields: [
    {
      fieldName: 'BSNS_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('부서') },
    },
    {
      fieldName: 'EMP_NO',
      dataType: 'text',
      editable: false,
      header: { text: t('사번') },
    },
    {
      fieldName: 'KOR_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('성명') },
    },
    {
      fieldName: 'REG_NO',
      dataType: 'text',
      editable: false,
      header: { text: t('주민번호') },
    },
    {
      fieldName: 'SAGONO',
      dataType: 'text',
      editable: false,
      header: { text: t('사고번호') },
    },
    {
      fieldName: 'OCCURDATE',
      dataType: 'text',
      editable: false,
      header: { text: t('재해일자') },
    },
    {
      fieldName: 'HLD_OFFI_GBN',
      dataType: 'text',
      editable: false,
      header: { text: t('재직구분') },
      lookupDisplay: true,
    },
    {
      fieldName: 'SAGOTYPE',
      dataType: 'text',
      editable: false,
      header: { text: t('사고유형') },
      lookupDisplay: true,
    },
    {
      fieldName: 'SJE_TYPE_CD',
      dataType: 'text',
      editable: false,
      header: { text: t('요양내용') },
      lookupDisplay: true,
    },

    //  저장 위함
    { fieldName: 'ADDR', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'COM_ENT_DATE', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_NM', dataType: 'text', visible: false },
    { fieldName: 'DMCL_DOM', dataType: 'text', visible: false },
    { fieldName: 'INJURYTYPE', dataType: 'text', visible: false },
    { fieldName: 'OCCURTIME', dataType: 'text', visible: false },
    { fieldName: 'OFFICE_TEL', dataType: 'text', visible: false },
    { fieldName: 'RETI_TMP_DATE', dataType: 'text', visible: false },
    { fieldName: 'SAGOGAEYO', dataType: 'text', visible: false },
    { fieldName: 'SAGOLOC', dataType: 'text', visible: false },
    { fieldName: 'SALARYDTE', dataType: 'text', visible: false },
    { fieldName: 'TELNO1', dataType: 'text', visible: false },
    { fieldName: 'UNION_YN', dataType: 'text', visible: false },
    { fieldName: 'UNT_DUTY_NM', dataType: 'text', visible: false },
    { fieldName: 'SANNO', dataType: 'text', visible: false },
    { fieldName: 'INJYRYPART', dataType: 'text', visible: false },
  ],
  columns: [],
})

grdPopUpProps.columns = grdPopUpProps.fields

// 저장관련 로직 시작
//셀더블클릭할때 데이터저장

//셀을 더블클릭하면 더블클릭한 셀의 로우의 데이터를 저장함
const onCellDblClicked = (grid, clickData) => {
  grdPopUp.value.getGridView().checkItem(clickData.dataRow, true)
  new saveFlowHelper(vm, t)
    .setBefore(beforeSave01)
    .setQuery(saveData01)
    .setAfter(afterSave01)
    .showMessage(false)
    .run()

  closePopup()
}
// 저장관련 로직 끝

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdPopUp])
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .run()
  } else if (btn.id === 'btnSelect') {
    //선택버튼을 클릭하면 선택한 데이터가 메인 그리드에 추가됨
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave01)
      .setQuery(saveData01)
      .setAfter(afterSave01)
      .showMessage(false)
      .run()
    //selectData()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

//조회관련 로직 시작
const searchData01 = () => {
  return commonSearchApi({
    queryId: 'SAFAG0010_SEARCH09',
    param: MainSearchParams,
  })
}

const afterSearch01 = (res) => {
  // user ID와 EMP_NO 일치 하는 값만 대입(최초 조회시 로그인ID로 비교)
  let rowData = null

  grdPopUp.value.getDataProvider().setRows(res.ORESULT_CUR)
  let params = {
    userStore: userStore,
    params: MainSearchParams,
    mgs: '등록(사고) 조회했습니다.',
    crudGbn: 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
}

//조회관련 로직 끝

//선택버튼 관련 로직 시작
const beforeSave01 = () => {
  let checkedData = grdPopUp.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('데이터를 선택해주세요.'))
    return false
  }
  return true
}

const saveData01 = () => {
  let saveParam = []
  let checkedData = grdPopUp.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdPopUp.value.getDataProvider().getJsonRow(checkedData[i])
    console.log('data', data)
    let saveData = {
      ADDR: data.ADDR, //주소
      BSNS_CD: data.BSNS_CD, //사업부코드
      BSNS_NM: data.BSNS_NM, //사업부
      CMPNY_DIV: data.CMPNY_DIV, //회사구분
      COM_ENT_DATE: data.COM_ENT_DATE, //회사입사일자
      DEPT_CD: data.DEPT_CD, //부서코드
      DEPT_NM: data.DEPT_NM, //부서명
      DMCL_DOM: data.DMCL_DOM, //본적
      EMPLNO: data.EMP_NO, //사번
      SANGBN: 'A', //산재구분(일반사고)
      YOGBN: '0', //요양구분(최초요양)
      HLD_OFFI_GBN: data.HLD_OFFI_GBN, //재직구분
      INJURYPART: data.INJYRYPART, //상해종류
      INJURYTYPE: data.INJURYTYPE,
      KOR_NM: data.KOR_NM, //성명
      OCCURDATE: data.OCCURDATE, //재해일자
      OCCURTIME: data.OCCURTIME, //재해시간
      OFFICE_TEL: data.OFFICE_TEL, //회사전화
      REG_NO: data.REG_NO, //주민등록번호
      RETI_TMP_DATE: data.RETI_TMP_DATE, //퇴직일
      SAGOGAEYO: data.SAGOGAEYO, //사고개요
      SAGOLOC: data.SAGOLOC, //사고장소
      SAGONO: data.SAGONO, //사고번호
      SAGOTYPE: data.SAGOTYPE, //사고형태 코드
      SALARYDTE: data.SALARYDTE, //임금산정일자
      SANNO: data.SANNO, //산재번호
      SJE_TYPE_CD: '01', //산재구분코드(업무상사고)
      REQGBN: '4', //신청구분(진정) 2024.08.23 김민선사원요청으로 등록(사고)로 등록시 신청구분은 진정으로
      TELNO1: data.TELNO1, //휴대폰번호
      UNION_YN: data.UNION_YN, //노조가입여부
      UNT_DUTY_NM: data.UNT_DUTY_NM, //직무
    }
    saveParam.push(saveData)
    let params = {
      userStore: userStore,
      params: saveData,
      mgs: '등록(사고) 저장했습니다.',
      crudGbn: 'C', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
      logDesc: '', // 사유입력
      menuId: useLogsStore().menuId,
      menuNm: t(useLogsStore().menuId),
    }
    commonLogExecuteApi(params)
  }
  return commonExecuteApi({ queryId: 'SAFAG0010_SAVE_01', list: saveParam })
}

const afterSave01 = async (res) => {
  let selectedData = []
  for (let i = 0; i < res.list.length; i++) {
    let param = {
      CMPNY_DIV: res.list[i].CMPNY_DIV,
      STATUS: '',
      DATE_YN: 'N',
      FROM: '',
      TO: '',
      SANNO: res.list[i].OUT_RES_SANNO,
      EMP_NO: res.list[i].EMPLNO,
      SANGBN: '',
      SANOK: '',
      SAGOTYPE: '',
      BSNS_CD: '',
      DEPT_CD: '',
      NAME: '',
    }
    await commonSearchApi({
      queryId: 'SAFAG0010_SEARCH01',
      param: param,
    }).then((res) => {
      selectedData.push(res.ORESULT_CUR[0])
    })
  }
  //선택한 데이터를 emit으로 올려준다.
  emit('selected', selectedData)
  closePopup()
}

//선택버튼 관련 로직 끝

//팝업닫을때 데이터 초기화
const closePopup = () => {
  MainSearchParams.CMPNY_DIV = userStore.cmpnyDiv
  MainSearchParams.DATE_YN = 'Y'
  MainSearchParams.FROM = dayjs().subtract(6, 'month').format('YYYY-MM-DD')
  MainSearchParams.TO = dayjs().format('YYYY-MM-DD')
  MainSearchParams.EMP_NO = ''
  MainSearchParams.NAME = ''
  dialog.value = false
}

// // 저장

//인원팝업 오픈 이벤트
const empPopupOpen = () => {
  if (MainSearchParams.CMPNY_DIV === '') {
    return Message.warn(t('회사 정보를 먼저 입력해주십시오'))
  }
  empPopup.value.openPopup({
    EMP_NM: MainSearchParams.EMP_NM,
    DISABLE: ['전체', '사내협력사', '단기공사', '기타'],
    readonly: true,
  })
}

watch(
  () => MainSearchParams.DATE_YN,
  (oldValue, newValue) => {
    if (newValue === 'Y') isReadonly.value = false
    else isReadonly.value = true
  }
)

//  재해자변경 감지
watch(
  () => MainSearchParams.EMP_NM,
  (newValue) => {
    if (newValue === '') {
      MainSearchParams.EMP_NO = ''
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
      <div class="title-bar" @mousedown="startDragging">최초요양시</div>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-3 pb-0">
        <IMenuTitle
          :use-permission="false"
          :button-list="['btnSearch', 'btnSelect', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0">
        <v-sheet class="searchArea d-flex">
          <i-select
            :label="$t('회사')"
            v-model="MainSearchParams.CMPNY_DIV"
            :items="codeList.company"
            item-value="COD"
            item-title="TXT"
            width="200px"
          >
          </i-select>
          <v-checkbox
            v-model="MainSearchParams.DATE_YN"
            true-value="Y"
            false-value="N"
            label="전체 기간"
            class="mr-2 mt-1"
          ></v-checkbox>
          <i-input
            width="150px"
            type="date"
            v-model="MainSearchParams.FROM"
            class="mr-0"
          />
          <span class="mx-2 mt-1">~</span>
          <i-input
            width="150px"
            type="date"
            v-model="MainSearchParams.TO"
            class="ml-0"
          />
          <i-input
            :label="$t('성명')"
            width="162px"
            type="TEXT"
            v-model="MainSearchParams.NAME"
            @keypress.enter="onButtonsClick({ id: 'btnSearch' })"
          />
        </v-sheet>
        <v-sheet>
          <RealGrid
            ref="grdPopUp"
            class="mt-2"
            style="height: 650px"
            :grid-view-option="grdPopUpProps.gridViewOption"
            :keys="grdPopUpProps.keys"
            :fields="grdPopUpProps.fields"
            :columns="grdPopUpProps.columns"
            @onCellDblClicked="onCellDblClicked"
          />
        </v-sheet>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
<style scoped>
.draggable-dialog {
  position: absolute;
  user-select: none;
}
</style>
