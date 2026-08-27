<!--
  일주지앤에스 SI2팀 장필구
  보건 위험성 평가 > 기초 정보 관리 > 감소대책 가이드 관리(탭) > 추가(팝업)
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, commonRequest, commonSendApi } from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import RealGrid from '@/components/RealGrid.vue'

const emit = defineEmits(['selectCas'])

const dialog = ref(false)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const grdMain = ref(null)



// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: String(new Date().getFullYear()),
  CATEGORY_MA:'', // 구분
  RISK_CLASS:'', // 위험성 분류
  MAG_CD:'', // 관리 코드
  GUIDE:'',
})

const codeList = reactive({
  // Category: [],
  CATEGORY_MA:[
    { COD: '', TXT: '선택' },
    { COD: 'A', TXT: '화학물질' },
    { COD: 'B', TXT: '소음' },
    { COD: 'C', TXT: '근골' },
  ],
  RISK_CLASS:[
    { COD: '', TXT: '선택' },
    { COD: 'A', TXT: '매우높음' },
    { COD: 'B', TXT: '높음' },
    { COD: 'C', TXT: '보통' },
    { COD: 'D', TXT: '낮음' },
    { COD: 'E', TXT: '매우낮음' },
  ],
})

//그리드 속성셋팅
// const grdMainProps = reactive({
//   gridViewOption: { stateBar: { visible: false }, edit: { editable: false } },
//   keys: [],
//   fields: [
//     { fieldName: 'CASNO', width: '40', dataType: 'text', header: { text: t('CAS 번호') }, },
//     { fieldName: 'CASNM_KOR', width: '50', dataType: 'text', header: { text: t('물질명(국문)') }, },
//     { fieldName: 'CASNM_ENG', width: '80', dataType: 'text', header: { text: t('물질명(영문)') }, },
//     { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') }, visible: false },
//   ],
//   columns: [],
// })

// grdMainProps.columns = grdMainProps.fields

const openPopup = (parm) => {
  // console.log(parm.ID)
  // console.log(parm.YEAR)
  if (parm.ID === undefined || parm.ID === '') {
    // console.log('1111111111111111111')
  } else {
    // console.log('2222222222222222222')
    searchParams.ID = parm.ID
    searchParams.YEAR = parm.YEAR
    onButtonsClick({ id: 'btnSearch' })
  }
  dialog.value = true
}

// button click event
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    // console.log('저장 된 정보 조회')
    getData()
  } else if (btn.id === 'btnUpdate') {
    // console.log('1111')
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnClose') {
    closePopup()
  }
}

// 저장 전
const beforeSave = () => {
  // validation 체크
  // 대분류
  if(searchParams.CATEGORY_MA === '') {
    return Message.warn(t('구분을 선택해 주십시요.'))
  }
  // 중분류
  if(searchParams.RISK_CLASS === '') {
    return Message.warn(t('위험성 분류를 선택해 주십시요.'))
  }
  return true
}

// 저장
const saveData = () => {
  let saveParams = []
  saveParams.push(searchParams)
  // console.log('saveParams : ', saveParams)
  return commonExecuteApi({ queryId : 'HLTAA0010_SAVE_07', list: saveParams })
}

// 저장 후
const afterSaveData = () => {
  // onButtonsClick({ id: "btnSearch" })
  Message.success(t('성공적으로 저장되었습니다'))
  closePopup()
}

// 그리드 데이터 가져오기
const getData = () => {
  new queryFlowHelper(vm, t)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회 
const searchData = () => {
  // console.log('searchParams : ', searchParams)
  return commonSearchApi({ queryId: 'HLTAA0010_SEARCH_07', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  // console.log('res.ORESULT_CUR : ', res.ORESULT_CUR)
  searchParams.ID = res.ORESULT_CUR[0].ID,
  searchParams.CATEGORY_MA = res.ORESULT_CUR[0].CATEGORY_MA, // 대분류
  searchParams.RISK_CLASS = res.ORESULT_CUR[0].RISK_CLASS,  // 중분류
  searchParams.MAG_CD = res.ORESULT_CUR[0].MAG_CD, // 소분류
  searchParams.GUIDE = res.ORESULT_CUR[0].GUIDE// 카테고리1
}

/* ********** 닫기 ********** */
const closePopup = () => {
  searchParams.CATEGORY_MA = ''
  searchParams.RISK_CLASS =''
  searchParams.MAG_CD =''
  searchParams.GUIDE =''
  // grdMain.value.getDataProvider().setRows([])
  emit("closed")
  dialog.value = false
}

const onCellDblClicked = (grid, clickData) => {
  // let data = grdMain.value.getGridView().getSelectionData()[0]
  emit('selectCas', data)
  closePopup()
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
    width="700"

    class="p-absolute user-select-none"
  >
    <v-sheet
      color="primarySub" 
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
    >
      <span>감소대책 가이드 수정/저장</span>
    </v-sheet>
    <v-card class="pa-0  rounded-b-5">
      <v-card-title class="pa-4 pb-0">
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <div class="pa-4 pb-2">
        <v-sheet class="searchArea d-flex flex-column">
          <div class="d-flex">
            <i-select
              :label="$t('기준년도')"  
              v-model="searchParams.YEAR"
              label-width="70px" 
              width="200px"
              type="YEAR"
            />
          </div>
          <div class="d-flex">
            <i-select
              v-model="searchParams.CATEGORY_MA"
              :items="codeList.CATEGORY_MA"
              :label="$t('구분')"
              label-width="70px" 
              width="200px"
              item-value="COD"
              item-title="TXT" 
            />
            <i-select
              v-model="searchParams.RISK_CLASS"
              :items="codeList.RISK_CLASS"
              :label="$t('위험성 분류')"
              label-width="70px" 
              width="200px"
              item-value="COD"
              item-title="TXT" 
            />
            <i-input
              v-model="searchParams.MAG_CD"
              :label="$t('관리 코드')"
              label-width="70px" 
              width="200px"
            />
          </div>
          <div class="d-flex">
            <i-input
              :label="$t('대책수립 가이드')"
              v-model="searchParams.GUIDE"
              label-width="100px" 
              width="640px"
            />
          </div>
          <!-- <div class="d-flex">
            <i-input
              v-model="searchParams.BIGO"
              :label="$t('관리 방안')"
              label-width="70px" 
              width="500px"
            />
          </div> -->
        </v-sheet>
      </div>
      <!-- <div class="d-flex fill-height"> 
        <v-card-text class="pa-4 pt-0 content-area">
          <div class="d-flex flex-column fill-height">
            <IGridTitle
              :title="$t('CAS 목록')"
            ></IGridTitle>
            <v-sheet class="searchArea flex-column">
              <RealGrid 
                ref="grdMain"
                style="height: 519px;"
                :grid-view-option="grdMainProps.gridViewOption"
                :keys="grdMainProps.keys"
                :fields="grdMainProps.fields"
                :columns="grdMainProps.columns"
                @onCellDblClicked="onCellDblClicked"
              />
            </v-sheet>
          </div>
        </v-card-text>
      </div> -->
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
</style>
