<script setup>
import HLTIB0010Tab01 from './HLTIB0010Tab01.vue'
import HLTIB0010Tab02 from './HLTIB0010Tab02.vue'
import HLTIB0010Tab03 from './HLTIB0010Tab03.vue'
import HLTIB0010Tab04 from './HLTIB0010Tab04.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { ref, reactive } from 'vue'
import Message from '@hiway/utils/notify'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import { useUserStore } from '@hiway/stores/user'
const dialog = ref(false)
const carouselSlide = ref(0)
const userStore = useUserStore()
const rowData = reactive({})
const tab01Data = reactive({})
const tab01 = ref(null)
const tab02 = ref(null)
const tab03 = ref(null)
const tab04 = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const esSeq = ref(null) //수정시 다음단계를 진행하기 위한값
const emit = defineEmits(['closed', 'omitedSave', 'deleteOmitYn'])
const closeDate = ref(null)
const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  ES_SEQ: '',
  WORK_STANDARD_ID: '',
})

//등록시 작업표준에 이전조사이력이 있으면 이전조사이력을 조회하고, 조사이력이 없으면 빈값으로
const openPopup = (data) => {
  dialog.value = true
  data.MODIFY = false //수정이 아니다. (신규등록이다.)
  Object.assign(rowData, data)
  //조사내역이 있다.
  if (rowData.ES_SEQ) {
    searchParam.WORK_STANDARD_ID = rowData.WORK_STANDARD_ID
    Promise.all([
      commonSearchApi({
        queryId: 'HLTIB0010_SEARCH_10',
        param: searchParam,
      }),
      commonSearchApi({
        queryId: 'HLTIB0010_SEARCH_11',
        param: searchParam,
      }),
    ]).then((res) => {
      delete res[0].ORESULT_CUR.ES_SEQ //새로 등록시에 ES_SEQ는 없어야 해서 삭제함
      delete rowData.ES_SEQ
      tab01.value.setInvField(res[0].ORESULT_CUR, res[1].ORESULT_CUR) //조사개요 조회값
    })
  }
}

//수정시
const openPopup2 = (data) => {
  dialog.value = true
  //이전 데이터 불러옴
  searchParam.ES_SEQ = data.ES_SEQ
  searchParam.WORK_STANDARD_ID = data.WORK_STANDARD_ID
  data.MODIFY = true //수정이다.
  Object.assign(rowData, data)

  Promise.all([
    commonSearchApi({
      queryId: 'HLTIB0010_SEARCH_10',
      param: searchParam,
    }),
    commonSearchApi({
      queryId: 'HLTIB0010_SEARCH_11',
      param: searchParam,
    }),
  ]).then((res) => {
    tab01.value.setInvField(res[0].ORESULT_CUR, res[1].ORESULT_CUR) //조사개요 조회값
    //tab01.value.setUnitField() //작업설명 조회값
    esSeq.value = res[0].ORESULT_CUR[0].ES_SEQ //순번
  })
}

const closePopup = () => {
  dialog.value = false
  carouselSlide.value = 0 //케러셀 초기화
  esSeq.value = null //수정시 seq 초기화
  Object.keys(tab01Data).forEach((key) => {
    delete tab01Data[key]
  })

  emit('closed')
}

//유해요인조사등록 1/4 저장하고 나서 저장한 데이터 다시 리턴받음(다음단계 클릭할때 저장했는지 확인여부를 위해)
const receviedTab01Data = async (data) => {
  data.list[0].ES_SEQ = data.list[0].OUT_RES_ES_SEQ
  Object.assign(tab01Data, data.list[0])
  //조사생략이 된 상태에서 조사생략조건에 해당하지 않는 값으로 변경하면 조사생략이 아니기 때문에 생략된 상태에서 값 변경했을때 조사생략조건이랑 비교함
  //만약 조사생략 조건이 아니라면 조사생략값을 빈값으로 만들어준다. 3/4,4/4 조사진행이 가능하도록
  //if (rowData.OMIT_YN === 'Y') {
  let param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    WORK_STANDARD_ID: data.list[0].WORK_STANDARD_ID,
    ES_SEQ: data.list[0].ES_SEQ,
  }
  commonSearchApi({
    queryId: 'HLTIB0010_SEARCH_17',
    param: param,
  }).then(async (res) => {
    //조사생략된 상태이다.
    //저장한 값이 조사생략 조건에 해당하지 않으면
    if (res.ORESULT_CUR[0].OMIT_YN === 'N') {
      tab01Data.OMIT_YN = ''
      emit('deleteOmitYn', tab01Data) //조사생략값을 삭제하는 emit
    } else {
      //조사생략이 아닌 상태에서 조사생략 조건으로 값을 변경했을때
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
          omitedSaved(res.ORESULT_CUR[0].OMIT_REMARKS)
        }
      }
    }
  })
  //}
  //임시저장했을때는 다음단계로 넘어가지 않도록
  if (!data.tempSaved) {
    nextChangeStep()
  }
}

const omitedSaved = (remarks) => {
  if (!tab01Data.ES_SEQ) {
    tab01Data.ES_SEQ = esSeq.value
  }
  tab01Data.OMIT_REMARKS = remarks
  emit('omitedSave', tab01Data)
  //closePopup을 호출하면 되는데 closePopup을 호출하면 closed라는 emit이 발생됨
  //closed emit은 재조회만 하는데 이 상황에서는 재조회 및,상태값을 변경시켜야해서 따로 초기화 코드를 넣음
  dialog.value = false
  carouselSlide.value = 0 //케러셀 초기화
  esSeq.value = null //수정시 seq 초기화
  Object.keys(tab01Data).forEach((key) => {
    delete tab01Data[key]
  })
}

const deleteOmitYnTab02 = () => {
  tab01Data.OMIT_YN = ''
  tab01Data.CLOSE_DATE = ''
  emit('deleteOmitYn', tab01Data)
}

defineExpose({
  openPopup,
  openPopup2,
})

//개선등록후 조사등록 팝업열때는 다음단계로만 넘어가도록
const setImpResistY = () => {
  //등록 1 -> 2 로 넘어갈때 필요한 데이터가 있어서 개선등록했을때는 한번만 실행
  tab01Data.MODIFY = true //수정플래그값
  //일반유저면 플래그값 추가해서 하위 컴포넌트에 props로 내려준다.
  if (rowData.nomalUser) {
    tab01Data.nomalUser = true
  }
  Object.assign(tab01Data, tab01.value.getTab01Data())
}

const impResistY = () => {
  if (carouselSlide.value < 3 && carouselSlide.value >= 0) {
    carouselSlide.value += 1
  }
}

//다음단계 버튼 이벤트
const nextChangeStep = () => {
  //수정시에만 플래그값 넣음
  if (esSeq.value && !tab01Data.MODIFY) {
    tab01Data.MODIFY = true //수정플래그값
    Object.assign(tab01Data, tab01.value.getTab01Data())
  }

  if (carouselSlide.value < 3 && carouselSlide.value >= 0) {
    carouselSlide.value += 1
  }
}

//이전단계 버튼 이벤트
const preChangeStep = () => {
  if (carouselSlide.value <= 3 && carouselSlide.value > 0) {
    carouselSlide.value -= 1
  }
}
</script>

<template>
  <v-dialog v-model="dialog" height="1200" width="65%" class="draggable-dialog" persistent :no-click-animation="true">
    <v-carousel :show-arrows="false" v-model="carouselSlide" height="100%" hide-delimiter-background hide-delimiters>
      <v-carousel-item>
        <HLTIB0010Tab01
          @tab01Saved="receviedTab01Data"
          @btnCloseClick="closePopup"
          @nextChangeStep="nextChangeStep"
          @impResistY="impResistY"
          @setImpResistY="setImpResistY"
          :row-data="rowData"
          ref="tab01"
        ></HLTIB0010Tab01>
      </v-carousel-item>
      <!-- 2번과 3번에 v-if를 넣은이유
      v-if가 없을때 2번화면에 있다가 1번화면으로 넘어가서 단위작업을 수정하고 다시 2번화면으로 넘어가면 수정한 단위작업이 적용되지 않음 ->마운트 할때만 조회를 하는데 v-if가 없으면 마운트가 한번만 되기때문ㅇ'
      v-if가 있을때는 화면이 보여질때마다 마운트가 되기때문에 수정된 사항이 적용되어서 보이도록 수정함
       -->
      <v-carousel-item>
        <HLTIB0010Tab02
          :tab01-data="tab01Data"
          @btnCloseClick="closePopup"
          @omitedSaved="omitedSaved"
          @saved="nextChangeStep"
          @nextChangeStep="nextChangeStep"
          @preChangeStep="preChangeStep"
          @deleteOmitYnTab02="deleteOmitYnTab02"
          @impResistY="impResistY"
          v-if="carouselSlide === 1"
          ref="tab02"
        ></HLTIB0010Tab02>
      </v-carousel-item>
      <v-carousel-item>
        <HLTIB0010Tab03
          ref="tab03"
          :tab01-data="tab01Data"
          @btnCloseClick="closePopup"
          @saved="nextChangeStep"
          @nextChangeStep="nextChangeStep"
          @preChangeStep="preChangeStep"
          @impResistY="impResistY"
          v-if="carouselSlide === 2"
        ></HLTIB0010Tab03>
      </v-carousel-item>
      <v-carousel-item>
        <HLTIB0010Tab04
          :tab01-data="tab01Data"
          @btnCloseClick="closePopup"
          @preChangeStep="preChangeStep"
          ref="tab04"
        ></HLTIB0010Tab04>
      </v-carousel-item>
    </v-carousel>
  </v-dialog>
</template>

<style scoped></style>
