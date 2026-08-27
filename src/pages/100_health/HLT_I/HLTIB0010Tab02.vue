<script setup>
import { ref } from 'vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import IGridTitle from '@/components/IGridTitle.vue'
import HLTIB0010Tab02_Tab01 from './HLTIB0010Tab02_Tab01.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import { commonExecuteApi, commonSearchApi } from '@hiway/api/commonApi'
import { useUserStore } from '@hiway/stores/user'
import Message from '@hiway/utils/notify'
const menuTitle = ref(null)

const emit = defineEmits([
  'btnCloseClick',
  'omitedSaved',
  'saved',
  'nextChangeStep',
  'preChangeStep',
  'deleteOmitYnTab02',
  'impResistY',
])
const tab01 = ref(null)
const tab02 = ref(null)
const tab03 = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const isAlreadySaved = ref(false)
const saved = ref(true)
let unitWork1 = reactive({})
let unitWork2 = reactive({})
let unitWork3 = reactive({})
const props = defineProps({
  tab01Data: {
    type: Object,
  },
})

const tab = ref('work_1')
const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    emit('btnCloseClick')
  } else if (btn.id === 'btnPrevStep') {
    emit('preChangeStep')
  } else if (btn.id === 'btnTemporaryStorage') {
    tempSaveTab02()
  } else {
    //개선등록 완료했을때는 그냥 다음단계로
    if (props.tab01Data.IMP_RESIST_YN === 'Y') {
      emit('impResistY')
    } else {
      saveTab02()
    }
  }
}

//임시저장
const tempSaveTab02 = async () => {
  let flag1 = tab01.value.getModifyFlag()
  let flag2 = tab02.value.getModifyFlag()
  let flag3 = tab03.value.getModifyFlag()
  let flagArray = []
  flagArray.push(flag1)
  flagArray.push(flag2)
  flagArray.push(flag3)
  // 번호와 flag를 묶어서 배열로 만들기
  const Array = [
    { no: 1, flag: flag1 },
    { no: 2, flag: flag2 },
    { no: 3, flag: flag3 },
  ]

  //  변경사항이 있는 단위작업의 번호만 추출
  const selectedFlags = Array.filter((item) => item.flag === false).map((item) => item.no)
  //변경사항이 존재하면
  if (selectedFlags.length > 0) {
    const flagText = selectedFlags.join(',')
    let message = `단위작업 ${flagText}에 수정사항이 있습니다.
                 임시저장 하시겠습니까?`
    let result = await vm.$swal({
      title: message,
      showCancelButton: true,
    })
    if (result.isConfirmed) {
      new saveFlowHelper(vm, t)
        .setBefore(beforeSaveTab02)
        .setQuery(saveTab02Data)
        .showMessage(false)
        .setAfter(tempAfterSave02)
        .run()
    }
  } else {
    //수정인데 변경사항 없을때
    if (props.tab01Data.MODIFY && saved.value === true) {
      let param = {
        CMPNY_DIV: userStore.cmpnyDiv,
        WORK_STANDARD_ID: props.tab01Data.WORK_STANDARD_ID,
        ES_SEQ: props.tab01Data.ES_SEQ,
      }
      commonSearchApi({
        queryId: 'HLTIB0010_SEARCH_17',
        param: param,
      }).then(async (res) => {
        if (res.ORESULT_CUR[0].OMIT_YN === 'Y') {
          let result = await vm.$swal({
            title: `해당 작업은 관계 법령 의거
              유해요인조사 생략 대상 작업으로
              현 단계에서 조사를 종료합니다.

              <div style=color:red;>
              *관계 법령 : 산업안전보건기준에 관한 규칙 제 657조
              근골격계부담작업의 범위 및 유해요인조사 방법에 관한 고시 제 3조
              </div>
          `,
          })
          if (result.isConfirmed) {
            emit('omitedSaved', res.ORESULT_CUR[0].OMIT_REMARKS)
          }
        } else {
          new saveFlowHelper(vm, t)
            .setQuery(saveTab02Data)
            .setConfirmMessage('임시저장 하시겠습니까?')
            .setAfter(tempAfterSave02)
            .run()
        }
      })
    }
    //1/4까지만 저장하고 수정인데 2/4처음 저장할때
    else if (props.tab01Data.MODIFY && saved.value === false) {
      new saveFlowHelper(vm, t)
        .setBefore(beforeSaveTab02)
        .setQuery(saveTab02Data)
        .setConfirmMessage('임시저장 하시겠습니까?')
        .setAfter(tempAfterSave02)
        .run()
    } else {
      //변경사항이 없고 저장되지 않았으면 저장후 다음단계
      if (!isAlreadySaved.value) {
        new saveFlowHelper(vm, t)
          .setBefore(beforeSaveTab02)
          .setQuery(saveTab02Data)
          .setConfirmMessage('임시저장 하시겠습니까?')
          .setAfter(tempAfterSave02)
          .run()
      }
    }
  }
}

const tempAfterSave02 = (res) => {
  try {
    if (res) {
      Message.success(t('저장되었습니다.'))
      tab01.value.setModifyFlag()
      tab02.value.setModifyFlag()
      tab03.value.setModifyFlag()
    }
  } catch (error) {
    Message.error(t(error))
    return false
  }

  let param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    WORK_STANDARD_ID: res.list[0].WORK_STANDARD_ID,
    ES_SEQ: res.list[0].ES_SEQ,
  }
  commonSearchApi({
    queryId: 'HLTIB0010_SEARCH_17',
    param: param,
  }).then(async (res) => {
    if (res.ORESULT_CUR[0].OMIT_YN === 'Y' && !props.OMIT_YN) {
      let result = await vm.$swal({
        title: `해당 작업은 관계 법령 의거
              유해요인조사 생략 대상 작업으로
              현 단계에서 조사를 종료합니다.

              <div style=color:red;>
              *관계 법령 : 산업안전보건기준에 관한 규칙 제 657조
              근골격계부담작업의 범위 및 유해요인조사 방법에 관한 고시 제 3조
              </div>
          `,
      })
      if (result.isConfirmed) {
        emit('omitedSaved')
      }
    }
    //조사생략 상태에서 조사생략조건이 아닌 값으로 변경시
    else if (props.tab01Data.OMIT_YN === 'Y' && res.ORESULT_CUR[0].OMIT_YN === 'N') {
      if (res.ORESULT_CUR[0].OMIT_YN === 'N') {
        emit('deleteOmitYnTab02') //조사생략값을 삭제하는 emit
      }
    } else {
      isAlreadySaved.value = true
    }
  })
}

const saveTab02 = async () => {
  let flag1 = tab01.value.getModifyFlag()
  let flag2 = tab02.value.getModifyFlag()
  let flag3 = tab03.value.getModifyFlag()
  let flagArray = []
  flagArray.push(flag1)
  flagArray.push(flag2)
  flagArray.push(flag3)
  // 번호와 flag를 묶어서 배열로 만들기
  const Array = [
    { no: 1, flag: flag1 },
    { no: 2, flag: flag2 },
    { no: 3, flag: flag3 },
  ]

  //  변경사항이 있는 단위작업의 번호만 추출
  const selectedFlags = Array.filter((item) => item.flag === false).map((item) => item.no)
  //변경사항이 존재하면
  if (selectedFlags.length > 0) {
    const flagText = selectedFlags.join(',')
    if (await beforeSaveTab02()) {
      let message = `단위작업 ${flagText}에 수정사항이 있습니다.
                 저장하시겠습니까?`
      let result = await vm.$swal({
        title: message,
        showCancelButton: true,
      })
      if (result.isConfirmed) {
        new saveFlowHelper(vm, t).setQuery(saveTab02Data).showMessage(false).setAfter(afterSaveTab02).run()
      }
    }
  } else {
    //저장하고나서 수정인데 변경사항 없을때
    if (props.tab01Data.MODIFY && saved.value === true) {
      let param = {
        CMPNY_DIV: userStore.cmpnyDiv,
        WORK_STANDARD_ID: props.tab01Data.WORK_STANDARD_ID,
        ES_SEQ: props.tab01Data.ES_SEQ,
      }
      commonSearchApi({
        queryId: 'HLTIB0010_SEARCH_17',
        param: param,
      }).then(async (res) => {
        if (res.ORESULT_CUR[0].OMIT_YN === 'Y') {
          let result = await vm.$swal({
            title: `해당 작업은 관계 법령 의거
              유해요인조사 생략 대상 작업으로
              현 단계에서 조사를 종료합니다.

              <div style=color:red;>
              *관계 법령 : 산업안전보건기준에 관한 규칙 제 657조
              근골격계부담작업의 범위 및 유해요인조사 방법에 관한 고시 제 3조
              </div>
          `,
          })
          if (result.isConfirmed) {
            emit('omitedSaved')
          }
        } else {
          emit('nextChangeStep')
        }
      })
    }
    //1/4까지만 저장하고 수정인데 2/4처음 저장할때
    else if (props.tab01Data.MODIFY && saved.value === false) {
      new saveFlowHelper(vm, t).setBefore(beforeSaveTab02).setQuery(saveTab02Data).setAfter(afterSaveTab02).run()
    } else {
      //변경사항이 없고 저장되지 않았으면 저장후 다음단계
      if (!isAlreadySaved.value) {
        new saveFlowHelper(vm, t).setBefore(beforeSaveTab02).setQuery(saveTab02Data).setAfter(afterSaveTab02).run()
      }
      //변경사항이 없고 저장되었으면 그냥 다음단계
      else {
        emit('nextChangeStep')
      }
    }
  }
}

const beforeSaveTab02 = async () => {
  unitWork1 = Object.assign(unitWork1, tab01.value.getTab02_Tab01Data()) //단위작업1 데이터
  unitWork2 = Object.assign(unitWork2, tab02.value.getTab02_Tab01Data()) //단위작업2 데이터
  unitWork3 = Object.assign(unitWork3, tab03.value.getTab02_Tab01Data()) //단위작업3 데이터

  let hoNoData1 = Object.fromEntries(Object.entries(unitWork1).filter(([key]) => key.includes('HO_NO'))) //단위작업1
  let hoNoData2 = Object.fromEntries(Object.entries(unitWork2).filter(([key]) => key.includes('HO_NO'))) //단위작업2
  let hoNoData3 = Object.fromEntries(Object.entries(unitWork3).filter(([key]) => key.includes('HO_NO'))) //단위작업3
  let hasNumber1 = Object.values(hoNoData1).some((value) => !isNaN(value) && value !== '' && value !== null)
  let hasNumber2 = Object.values(hoNoData2).some((value) => !isNaN(value) && value !== '' && value !== null)
  let hasNumber3 = Object.values(hoNoData3).some((value) => !isNaN(value) && value !== '' && value !== null)
  //정기조사일때만 단위작업 필수값 체크 수시신청일때는 필수값체크 안함

  if (!hasNumber1) {
    Message.warn(t('단위작업1의 부담작업평가를 해주세요.'))
    return false
  }
  if (!hasNumber2) {
    Message.warn(t('단위작업2의 부담작업평가를 해주세요.'))
    return false
  }
  if (!hasNumber3) {
    Message.warn(t('단위작업3의 부담작업평가를 해주세요.'))
    return false
  }

  return true
}

const saveTab02Data = () => {
  let saveParam = []
  let receivedData = []
  //단위작업탭1,2,3에 있는 데이터를 배열로 넣음
  receivedData.push(unitWork1)
  receivedData.push(unitWork2)
  receivedData.push(unitWork3)
  let unitWork1HoNo = '' //단위작업1 호
  let unitWork2HoNo = '' //단위작업2 호
  let unitWork3HoNo = '' //단위작업3 호
  for (let i in receivedData[0]) {
    if (i.includes('HO_NO')) {
      if (receivedData[0][i] !== null && receivedData[0][i] !== undefined && receivedData[0][i] !== '') {
        unitWork1HoNo += receivedData[0][i] + ','
      }
    }
  }
  unitWork1HoNo = unitWork1HoNo.slice(0, -1) //마지막 , 제거

  //단기간작업,간헐적작업 둘중 하나라도 체크되면
  //단기간작업,간헐적작업이 체크되지 않았을때만
  for (let i in receivedData[1]) {
    if (i.includes('HO_NO')) {
      if (receivedData[1][i] !== null && receivedData[1][i] !== undefined && receivedData[1][i] !== '') {
        unitWork2HoNo += receivedData[1][i] + ','
      }
    }
  }
  unitWork2HoNo = unitWork2HoNo.slice(0, -1) //마지막 , 제거

  for (let i in receivedData[2]) {
    if (i.includes('HO_NO')) {
      if (receivedData[2][i] !== null && receivedData[2][i] !== undefined && receivedData[2][i] !== '') {
        unitWork3HoNo += receivedData[2][i] + ','
      }
    }
  }
  unitWork3HoNo = unitWork3HoNo.slice(0, -1) //마지막 , 제거

  //단위작업1
  let saveData1 = {
    ES_SEQ: receivedData[0].ES_SEQ, //순번
    WORK_STANDARD_ID: receivedData[0].WORK_STANDARD_ID, //작업표준 ID
    UNIT_ID: receivedData[0].UNIT_ID_1,
    UNIT_SEQ: receivedData[0].UNIT_SEQ_1,
    HO_NO: unitWork1HoNo ? unitWork1HoNo : ' ',
    UNIT_GUBUN: 1,
  }
  //단위작업2
  let saveData2 = {
    ES_SEQ: receivedData[1].ES_SEQ, //순번
    WORK_STANDARD_ID: receivedData[1].WORK_STANDARD_ID, //작업표준 ID
    UNIT_ID: receivedData[1].UNIT_ID_2,
    UNIT_SEQ: receivedData[1].UNIT_SEQ_2,
    HO_NO: unitWork2HoNo ? unitWork2HoNo : ' ',
    UNIT_GUBUN: 2,
  }
  //단위작업3
  let saveData3 = {
    ES_SEQ: receivedData[2].ES_SEQ, //순번
    WORK_STANDARD_ID: receivedData[2].WORK_STANDARD_ID, //작업표준 ID
    UNIT_ID: receivedData[2].UNIT_ID_3,
    UNIT_SEQ: receivedData[2].UNIT_SEQ_3,
    HO_NO: unitWork3HoNo ? unitWork3HoNo : ' ',
    UNIT_GUBUN: 3,
  }
  saveParam.push(saveData1)
  saveParam.push(saveData2)
  saveParam.push(saveData3)
  return commonExecuteApi({
    queryId: 'HLTIB0010_SAVE_02',
    list: saveParam,
  })
}

const afterSaveTab02 = (res) => {
  try {
    if (res) {
      Message.success(t('저장되었습니다.'))
      tab01.value.setModifyFlag()
      tab02.value.setModifyFlag()
      tab03.value.setModifyFlag()
    }
  } catch (error) {
    Message.error(t(error))
    return false
  }

  let param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    WORK_STANDARD_ID: res.list[0].WORK_STANDARD_ID,
    ES_SEQ: res.list[0].ES_SEQ,
  }
  commonSearchApi({
    queryId: 'HLTIB0010_SEARCH_17',
    param: param,
  }).then(async (res) => {
    if (res.ORESULT_CUR[0].OMIT_YN === 'Y' && !props.OMIT_YN) {
      let result = await vm.$swal({
        title: `해당 작업은 관계 법령 의거
              유해요인조사 생략 대상 작업으로
              현 단계에서 조사를 종료합니다.

              <div style=color:red;>
              *관계 법령 : 산업안전보건기준에 관한 규칙 제 657조
              근골격계부담작업의 범위 및 유해요인조사 방법에 관한 고시 제 3조
              </div>
          `,
      })
      if (result.isConfirmed) {
        emit('omitedSaved', res.ORESULT_CUR[0].OMIT_REMARKS)
      }
    }
    //조사생략 상태에서 조사생략조건이 아닌 값으로 변경시
    else if (props.tab01Data.OMIT_YN === 'Y' && res.ORESULT_CUR[0].OMIT_YN === 'N') {
      if (res.ORESULT_CUR[0].OMIT_YN === 'N') {
        emit('deleteOmitYnTab02') //조사생략값을 삭제하는 emit
        emit('nextChangeStep')
      }
    } else {
      emit('saved')
      isAlreadySaved.value = true
    }
  })
}

onMounted(() => {
  if (props.tab01Data.IMP_RESIST_YN === 'Y') {
    menuTitle.value.visibleBtn('btnTemporaryStorage', false)
  }
  //수정일때만
  //if (props.tab01Data.MODIFY) {
  commonSearchApi({
    queryId: 'HLTIB0010_SEARCH_05',
    param: { WORK_STANDARD_ID: props.tab01Data.WORK_STANDARD_ID },
  }).then((res) => {
    if (res.ORESULT_CUR.length > 0) {
      if (res.ORESULT_CUR[0].HO_NO === null && res.ORESULT_CUR[1].HO_NO === null && res.ORESULT_CUR[2].HO_NO === null) {
        saved.value = false
        return false
      }
    }
    setTab02Data(res.ORESULT_CUR)
  })
  //}
})

//수정시 데이터 세팅
const setTab02Data = (data) => {
  tab01.value.setTab02_Tab01Data(data[0])
  tab02.value.setTab02_Tab01Data(data[1])
  tab03.value.setTab02_Tab01Data(data[2])
}

defineExpose({
  saveTab02,
  //setTab02Data,
})
</script>

<template>
  <v-sheet
    color="primarySub"
    height="50"
    class="px-4 d-flex align-center rounded-t-5 cursor-move"
    @mousedown="startDragging"
  >
    <span>유해요인조사등록 2/4</span>
  </v-sheet>
  <v-card class="pa-0 fill-height rounded-b-5">
    <IGridTitle
      :button-list="['btnPrevStep', 'btnTemporaryStorage', 'btnNextStep', 'btnClose']"
      @click-button="onButtonsClick"
      class="mt-2 mr-2"
      ref="menuTitle"
      :use-permission="false"
    ></IGridTitle>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex justify-space-between">
          <div class="mt-2 gridTitle">부담작업평가</div>
          <div>
            <i-input
              :label="$t('작업표준명')"
              width="300px"
              v-model="props.tab01Data.WORK_STANDARD_NM"
              readonly
            ></i-input>
          </div>
        </v-sheet>
        <div style="overflow-y: auto">
          <v-tabs class="mb-2" v-model="tab">
            <v-tab value="work_1">단위작업1 {{ props.tab01Data.UNIT_NM_1 }} </v-tab>
            <v-tab value="work_2">단위작업2 {{ props.tab01Data.UNIT_NM_2 }} </v-tab>
            <v-tab value="work_3">단위작업3 {{ props.tab01Data.UNIT_NM_3 }} </v-tab>
          </v-tabs>
          <v-window v-model="tab">
            <v-window-item eager value="work_1">
              <HLTIB0010Tab02_Tab01 ref="tab01" :tab01-data="props.tab01Data"></HLTIB0010Tab02_Tab01>
            </v-window-item>
            <v-window-item eager value="work_2">
              <HLTIB0010Tab02_Tab01 ref="tab02" :tab01-data="props.tab01Data"></HLTIB0010Tab02_Tab01>
            </v-window-item>
            <v-window-item eager value="work_3">
              <HLTIB0010Tab02_Tab01 ref="tab03" :tab01-data="props.tab01Data"></HLTIB0010Tab02_Tab01>
            </v-window-item>
          </v-window>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>
