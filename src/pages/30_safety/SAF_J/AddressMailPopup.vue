<script setup>
import { ref, reactive, onMounted, watch, nextTick } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { commonRequest, commonSendApi } from '@hiway/api/commonApi'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'

import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from '@hiway/api/commonApi'
import { useI18n } from 'vue-i18n'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'

const props = defineProps({
  isReadOnly: {
    type: Boolean,
    default: false,
  },
  titleReadOnly: {
    type: Boolean,
    default: false,
  },
  setBgColor: {
    type: Boolean,
    default: true,
  },
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const searchArea = ref(null)
const t = useI18n().t //다국어
const emit = defineEmits(['selected', 'compleat'])
const gunBun = ref(null)
const dialog = ref(false)
const editor = ref(null)
const empPopupToEmp = ref(null)
const empPopupReferer = ref(null)
const sanJeMailFlag = ref(null)

const chipArr = reactive({
  TO_EMP: [],
  REFERER: [],
})

// 메일전송
const mailParams = reactive({
  EMAIL: [],
  REFERER: [],
  // HIDDEN_REFERER: [],
  SUBJECT: '',
  CONTENT: '',
})


onMounted(() => {})



//팝업 오픈
const openPopup = (popupParam, page, EMAILDTE) => {
  
  // //팝업 visible
  dialog.value = true

  //그리드 삭제시 데이터 구분없이 바로 삭제 되도록 세팅 값
  grdMain.value.getDataProvider().setOptions({ softDeleting: false })
  grdSub.value.getDataProvider().setOptions({ softDeleting: false })

  searchMainGrid()
}

const grdMain = ref(null)
const grdSub = ref(null)

//메인 그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible:false } }, 
  fields : [
    { fieldName: "CMPNY_DIV", dataType: 'text', width: '100', editable: false,visible: false, lookupDisplay: true, header: { text: t('CMPNY_DIV') } },
    { fieldName: 'EMP_NO', dataType: 'text', width: '150', editable: false, visible: false,header: { text: t('EMP_NO') } },
    { fieldName: 'RCV_CMPNY_DIV', dataType: 'text', width: '150', editable: false,visible: false, lookupDisplay: true, header: { text: t('RCV_CMPNY_DIV') } },
    
    //출력 안함
    { fieldName: 'DEPT_NM', dataType: 'text', width: '250', editable: false, visible: true, header: { text: t('부서명') }, styleName: 'left-column'  },
    { fieldName: 'RCV_EMP_NO', dataType: 'text', width: '150', editable: false, header: { text: t('사번') }  },
    { fieldName: 'KOR_NM', dataType: 'text', width: '100', editable: false, header: { text: t('성명') } },
    { fieldName: 'EMAIL', dataType: 'text', width: '250', editable: false, header: { text: t('메일주소') }, styleName: 'left-column' },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields


//서브 그리드 속성셋팅
const grdSubProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible:false } }, 
  fields : [
    { fieldName: "CMPNY_DIV", dataType: 'text', width: '100', editable: false,visible: false, lookupDisplay: true, header: { text: t('CMPNY_DIV') } },
    { fieldName: 'EMP_NO', dataType: 'text', width: '150', editable: false,visible: false, header: { text: t('EMP_NO') } },
    { fieldName: 'RCV_CMPNY_DIV', dataType: 'text', width: '150', editable: false,visible: false, lookupDisplay: true, header: { text: t('RCV_CMPNY_DIV') } },
    
    //출력 안함
    { fieldName: 'DEPT_NM', dataType: 'text', width: '250', editable: false, visible: true, header: { text: t('부서명') }, styleName: 'left-column'  },
    { fieldName: 'RCV_EMP_NO', dataType: 'text', width: '150', editable: false, header: { text: t('사번') }  },
    { fieldName: 'KOR_NM', dataType: 'text', width: '100', editable: false, header: { text: t('성명') } },
    { fieldName: 'EMAIL', dataType: 'text', width: '250', editable: false, header: { text: t('메일주소') }, styleName: 'left-column' },
    
  ],
  columns : [],
})

grdSubProps.columns = grdSubProps.fields

//주소록 데이터 조회
const searchMainGrid = () => {
  const params = {
    CMPNY_DIV: userStore.cmpnyDiv,
    EMP_NO: userStore.userId
  }

  console.log('params ', params)

  commonSearchApi({ queryId: 'SAFJA0010_SEARCH_10', param: params }).then(res => {
    console.log(' res ::: ', res)
    if (res.ORESULT_CUR.length > 0) {

      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    }
  })
}

//버튼이벤트1
const onButtonsClick1 = (btn) => {
  
  if (btn.id === 'btnSendMail') {
  //발송
    let checkedRow = grdSub.value.getGridView().getCheckedRows()

    let subDataList = []

    for (let subChkData of checkedRow) {
      let subData = grdSub.value.getDataProvider().getJsonRow(subChkData)
      console.log('subData ', subData)
      subDataList.push(subData)
    }

    emit('selected', subDataList)
    closePopup()
  
  }else if (btn.id === 'btnClose') {
  //닫기
    closePopup()
  }
}


//버튼이벤트2
const onButtonsClick2 = (btn) => {
  
  if (btn.id === 'btnAddressAdd2') {
  //발송대상으로 보내기
    //주소록 체크 데이터
    let checkedRow = grdMain.value.getGridView().getCheckedRows()
    let subCheckedRow = grdSub.value.getGridView().getJsonRows(0,-1)


    if (checkedRow.length === 0)
    {
      Message.err('선택된 데이터가 없습니다.')
      return
    }

    console.log('grdMain.value.getGridView().getJsonRows() ', grdSub.value.getGridView().getJsonRows())


    for (let mainRowData of checkedRow) {
      const mRowData = grdMain.value.getDataProvider().getJsonRow(mainRowData)

      //확인 VALUE 
      let chkVal = true

      for (let subRowData of subCheckedRow) {
        if ((subRowData.RCV_CMPNY_DIV === mRowData.RCV_CMPNY_DIV
          && subRowData.RCV_EMP_NO === mRowData.RCV_EMP_NO)) {
            chkVal = false
        }
      }

      if (chkVal) {
        grdSub.value.getDataProvider().addRow(
          {
            CMPNY_DIV: mRowData.CMPNY_DIV,
            EMP_NO: mRowData.EMP_NO,
            RCV_CMPNY_DIV: mRowData.RCV_CMPNY_DIV,
            DEPT_NM: mRowData.DEPT_NM,
            RCV_EMP_NO: mRowData.RCV_EMP_NO,
            KOR_NM: mRowData.KOR_NM,
            EMAIL: mRowData.EMAIL,
          }
        ) 
      }
    }

  }else if (btn.id === 'btnPersonDelete') {
  //인원 삭제
    let checkedRow = grdMain.value.getGridView().getCheckedRows()

    if (checkedRow.length === 0)
    {
      Message.err('선택된 데이터가 없습니다.')
      return
    }

    vm.$swal({
      title: t('주소록 인원 정보를 삭제 하시겠습니까?'),
      showCancelButton: true,
    }).then((res) => {
      if (res.isConfirmed === true) {
        let saveParams = []

        for (let i = 0; i < checkedRow.length; i++) {
          let rtnData = grdMain.value.getDataProvider().getJsonRow(checkedRow[i])
          console.log('rtnData ', rtnData)

          saveParams.push(rtnData)
        }

        //주소록 데이터 삭제
        commonExecuteApi({
          queryId: 'SAFJA0010_DELETE_01'
          , list: saveParams
        }).then((res) => {
          console.log('주소록 정보 저장 결과 :: ', res)
          //주소록 그리드 조회
          searchMainGrid()
          Message.success('인원이 삭제되었습니다.')
        })
      }
    })



  }
}

//버튼이벤트3
const onButtonsClick3 = (btn) => {
  
  if (btn.id === 'btnPersonCreate') {
    //인원추가    
    empPopupToEmp.value.openPopup({ MULTI: true, readonly: true })
  } else if (btn.id === 'btnPersonDelete') {
  //인원삭제
    let checkedRow = grdSub.value.getGridView().getCheckedRows()

    if (checkedRow.length === 0)
    {
      Message.err('선택된 데이터가 없습니다.')
      return
    }

    // console.log('checkedRow ', checkedRow)

    
    grdSub.value.getDataProvider().removeRows(checkedRow)
    
  } else if (btn.id === 'btnAddressAdd') {
    //주소록에 인원추가
    let checkedRow = grdSub.value.getGridView().getCheckedRows()

    if (checkedRow.length === 0)
    {
      Message.err('선택된 데이터가 없습니다.')
      return
    }

    let saveParams = []

    for (let i = 0; i < checkedRow.length; i++) {
      let rtnData = grdSub.value.getDataProvider().getJsonRow(checkedRow[i])
      console.log('rtnData ', rtnData)

      saveParams.push(rtnData)
    }

    //주소록 데이터 저장
    commonExecuteApi({
      queryId: 'SAFJA0010_SAVE_04'
      , list: saveParams
    }).then((res) => {
      console.log('주소록 정보 저장 결과 :: ', res)
      //주소록 그리드 조회
      searchMainGrid()
      Message.success('주소록에 추가 완료되었습니다.')
    })
    
  }
}

//닫기
const closePopup = () => {
  //받는사람 초기화
  for (let i in chipArr) {
    chipArr[i] = []
  }
  mailParams.EMAIL = []
  mailParams.REFERER = []
  mailParams.SUBJECT = ''
  mailParams.CONTENT = ''
  dialog.value = false
}

// 인원조회(받는사람)
const onEmpSelectedToEmp = (row) => {
  console.log('row ', row)
  for (let i of row) {
    if (i.EMAIL && i.EMAIL !== '') {
      grdSub.value.getDataProvider().addRow(
        {
          CMPNY_DIV: userStore.cmpnyDiv,
          EMP_NO: userStore.userId,
          RCV_CMPNY_DIV: i.CMPNY_DIV,
          DEPT_NM: i.ASGN_NM,
          RCV_EMP_NO: i.EMP_NO,
          KOR_NM: i.EMP_NM,
          EMAIL: i.EMAIL,
        }
      ) 
  //     // 사람
  //     chipArr.TO_EMP.push({ EMP_NM: i.EMP_NM, EMAIL: i.EMAIL })
  //     const uniqueData = Array.from(
  //       new Set(chipArr.TO_EMP.map(JSON.stringify))
  //     ).map(JSON.parse)
  //     chipArr.TO_EMP = uniqueData

  //     // email
  //     mailParams.EMAIL.push(i.EMAIL)
  //     let setMail = new Set([...mailParams.EMAIL])
  //     mailParams.EMAIL = [...setMail]
    } else {
      Message.warn(t(`${i.EMP_NM} 님이 이메일주소가 없습니다.`))
    }
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
    width="900"
    height="780"
    class="p-absolute user-select-none">
      <v-sheet
        color="primarySub"
        height="50"
        class="px-4 d-flex align-center rounded-t-5 cursor-move">
        <span>주소록</span>

      </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
            class="mt-2"
            :use-permission="false" 
            :button-list="['btnSendMail', 'btnClose']"
            @click-button="onButtonsClick1"/>
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet>
            <IGridTitle
            title="주소록"
            class="mt-2"
            :use-permission="false" 
            :button-list="['btnAddressAdd2', 'btnPersonDelete']"
            @click-button="onButtonsClick2"/>
          </v-sheet>
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              class="mt-2"
              :gridViewOption="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"/>
          </v-sheet>
          <v-sheet>
            <IGridTitle
            title="발송대상"
            :use-permission="false"
            class="mt-2"
            :button-list="['btnPersonCreate','btnPersonDelete','btnAddressAdd']"
            @click-button="onButtonsClick3"
          />
          </v-sheet>
          <v-sheet class="h-auto">
            <RealGrid                  
              ref="grdSub"
              class="mt-2"
              :gridViewOption="grdSubProps.gridViewOption"
              :fields="grdSubProps.fields"
              :columns="grdSubProps.columns"/>
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog> 
  <EmpPopup ref="empPopupToEmp" @selected="onEmpSelectedToEmp" />
  <EmpPopup ref="empPopupReferer" @selected="onEmpSelectedReferer" />
</template>

<style scoped>
.td {
  border: 1px solid black;
}

::v-deep(.setWhiteColor > .v-input__control > .v-field) {
  background-color: #ffffff !important;
}
</style>
