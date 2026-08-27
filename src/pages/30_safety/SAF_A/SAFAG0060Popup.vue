<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import Message from '@hiway/utils/notify'
import { commonSearchApi, commonExecuteApi } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import { commonLogExecuteApi } from '@hiway/api/commonApi'

const dialog = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const userStore = useUserStore()
const empPopup = ref(null)
const grdMain = ref(null)
const emit = defineEmits(['selected'])

const openPopup = () => {
  dialog.value = true
  initCodeList()
}

const closePopup = () => {
  searchParam.CMPNY_DIV = ''
  searchParam.EMP_NO = ''
  searchParam.NAME = ''
  searchParam.REG_NO = ''
  dialog.value = false
}

const codeList = reactive({
  company: [], //회사
  yogbn: [], //요양구분
  sagotype2: [], //사고형태
  reqgbn: [], //신청구분
  injurypart: [], //상해부위
  injurytype: [], //상해종류
})

const searchParam = reactive({
  CMPNY_DIV: '', //회사
  EMP_NO: '', //산재자 사번
  NAME: '', //산재자이름
  REG_NO: '', //주민번호
  USER_ID: userStore.cmpnyDiv, //유저아이디
  IP_ADDRESS: userStore.clientIp, //IP주소
})

const initCodeList = () => {
  Promise.all([
    commonSearchApi({
      //회사조회
      queryId: 'searchCommonCode',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ALL_UP_CD: 'HHIZ000',
        USE_FLAG: 'Y',
        CODE_NAME_TYPE: '0',
      },
    }),
    commonSearchApi({
      //요양구분조회
      queryId: 'searchCommonCode',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ALL_UP_CD: 'HHIB250020',
        USE_FLAG: 'Y',
        CODE_NAME_TYPE: '0',
      },
    }),
    commonSearchApi({
      //사고형태조회
      queryId: 'SAFAG0050_POP_SEARCH02',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
      },
    }),
    commonSearchApi({
      //신청구분조회
      queryId: 'searchCommonCode',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        ALL_UP_CD: 'HHIB250010',
        USE_FLAG: 'Y',
        CODE_NAME_TYPE: '0',
      },
    }),
    commonSearchApi({
      //상해부위
      queryId: 'SAFAG0020_SEARCH02',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
      },
    }),
    commonSearchApi({
      //상해종류
      queryId: 'SAFAG0050_POP_SEARCH03',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        CODE: 'B030',
      },
    }),
  ]).then((res) => {
    //현대중공업,한국조선해양,모스
    codeList.company = res[0].ORESULT_CUR.filter(
      (x) => x.COD === 'HHI' || x.COD === '100' || x.COD === '230'
    )
    codeList.yogbn = res[1].ORESULT_CUR
    codeList.sagotype2 = res[2].ORESULT_CUR
    codeList.reqgbn = res[3].ORESULT_CUR
    codeList.injurypart = res[4].ORESULT_CUR
    codeList.injurytype = res[5].ORESULT_CUR
    grdMain.value.setBindingColumn('YOGBN', codeList.yogbn, 'COD', 'TXT')
    grdMain.value.setBindingColumn('SAGOTYPE', codeList.sagotype2, 'COD', 'TXT')
    grdMain.value.setBindingColumn('REQGBN', codeList.reqgbn, 'COD', 'TXT')
    grdMain.value.setBindingColumn(
      'INJURYPART',
      codeList.injurypart,
      'COD',
      'TXT'
    )
    grdMain.value.setBindingColumn(
      'INJURYTYPE',
      codeList.injurytype,
      'COD',
      'TXT'
    )
    codeList.company.unshift({ TXT: '전체', COD: '' })
  })
}

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnSelect') {
    selection()
  } else {
    closePopup()
  }
}

const onCellDblClicked = () => {
  let rowIdx = grdMain.value.getGridView().getCurrent().dataRow
  let rtnData = grdMain.value.getDataProvider().getJsonRow(rowIdx)
  let selectedData = []
  selectedData.push(rtnData)
  emit('selected', selectedData)
  closePopup()
}

const selection = () => {
  let chkNum = grdMain.value.getGridView().getCheckedRows(true)
  if (chkNum.length === 0) {
    Message.warn(t('데이터를 선택해주세요.'))
    return false
  } else {
    let selectedData = []
    for (let i = 0; i < chkNum.length; i++) {
      let data = grdMain.value.getDataProvider().getJsonRow(chkNum[i])
      selectedData.push(data)
    }
    emit('selected', selectedData)
    closePopup()
  }
}

const beforeSearch = () => {
  if (
    searchParam.EMP_NO === '' &&
    searchParam.NAME === '' &&
    searchParam.REG_NO === ''
  ) {
    Message.warn(t('조회 조건중 한가지 이상을 입력 후 조회 하시기 바랍니다.'))
    return false
  }
  return true
}

const searchData = () => {
  return commonSearchApi({
    queryId: 'SAFAG0060_POP_SEARCH01',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  let params = {
    userStore: userStore,
    params: searchParam,
    mgs: '개인정보관련 조회했습니다.',
    crudGbn: 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
}

const onEmpSelected = (val) => {
  searchParam.NAME = val.EMP_NM
  searchParam.EMP_NO = val.EMP_NO
}

const openEmpPopup = (gbn) => {
  if (gbn === '인원조회') {
    empPopup.value.openPopup({
      CMPNY_DIV: searchParam.CMPNY_DIV == '' ? 'HHI' : searchParam.CMPNY_DIV,
      HSE_ONLY: 'Y',
      EMP_NM: searchParam.NAME,
      EMP_NO: searchParam.EMP_NO,
      DISABLE: ['전체', '사내협력사', '단기공사', '기타'],
      SANJE: true,
    })
  }
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'FILENUM',
      dataType: 'text',
      editable: false,
      header: { text: t('파일번호') },
    },
    {
      fieldName: 'YOGBN',
      dataType: 'text',
      lookupDisplay: true,
      editable: false,
      editor: {
        type: 'dropdown',
      },
      header: { text: t('요양구분') },
    },

    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('부서') },
    },
    {
      fieldName: 'EMPLNO',
      dataType: 'text',
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
      fieldName: 'SALARYDTE',
      dataType: 'text',
      dataType: 'datetime',
      datetimeFormat: 'yyyy-MM-dd',
      editable: false,
      header: { text: t('재해일자') },
    },
    {
      fieldName: 'REQGBN',
      dataType: 'text',
      editable: false,
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
      header: { text: t('신청구분') },
    },
    {
      fieldName: 'SAGOTYPE',
      dataType: 'text',
      editable: false,
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
      header: { text: t('사고유형') },
    },
    {
      fieldName: 'INJURYTYPE',
      dataType: 'text',
      editable: false,
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
      header: { text: t('상해종류') },
    },
    {
      fieldName: 'INJURYPART',
      dataType: 'text',
      editable: false,
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
      header: { text: t('재해부위') },
    },
    {
      fieldName: 'RECEIPTDTE',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'TELNO1',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SANNO',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'OCCURDATE',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'CMPNY_DIV',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'SANGBN',
      visible: false,
      header: { text: t('') },
    },
    {
      fieldName: 'GRADE',
      visible: false,
      header: { text: t('') },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  searchParam.CMPNY_DIV = userStore.cmpnyDiv
})
defineExpose({
  openPopup,
})
//주민번호 체크(숫자,-만 입력가능)
const regValidation = (value) => {
  searchParam.REG_NO = searchParam.REG_NO.replace(/[^0-9-]$/g, '')
}
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1300"
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
      <div class="title-bar" @mousedown="startDragging">추가</div>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-3 pb-0">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnSearch', 'btnSelect', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea d-flex">
            <i-select
              label-width="50px"
              :label="$t('회사구분')"
              :items="codeList.company"
              item-title="TXT"
              item-value="COD"
              v-model="searchParam.CMPNY_DIV"
              width="200px"
            >
            </i-select>
            <i-input
              :label="$t('산재자사번/성명')"
              v-model="searchParam.EMP_NO"
              @click:appendInner="openEmpPopup('인원조회')"
              @keydown.enter="
                (e) => {
                  openEmpPopup('인원조회')
                }
              "
              append-inner-icon="mdi-magnify"
              width="250px"
            >
            </i-input>
            <i-input
              v-model="searchParam.NAME"
              @keydown.enter="() => onButtonsClick({ id: 'btnSearch' })"
              width="100px"
            >
            </i-input>
            <i-input
              :label="$t('주민번호')"
              v-model="searchParam.REG_NO"
              :rules="[regValidation]"
              width="200px"
            >
            </i-input>
          </v-sheet>
          <v-sheet>
            <RealGrid
              ref="grdMain"
              class="mt-2"
              style="height: calc(100vh - 420px)"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              @onCellDblClicked="onCellDblClicked"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
    <EmpPopup ref="empPopup" @selected="onEmpSelected"></EmpPopup>
  </v-dialog>
</template>
