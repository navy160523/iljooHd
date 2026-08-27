<!--
  화면명 : 단기공사 15일 이상 공사 SCMS 연락처
  화면개요 : 단기공사 15일 이상 공사 SCMS 연락처
  최종수정일자: 2025-01-10
  작성자: 한민규
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from "vue-i18n";
import IGridTitle from "@/components/IGridTitle.vue";
import RealGrid from "@/components/RealGrid.vue";
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { commonSearchApi, getCodeList, commonExecuteApi, commonSendApi,getCompanyList } from '@hiway/api/commonApi'
const emit = defineEmits(['selected'])

onMounted(() => {
  // grd1.value.getDataProvider().setRows(data);
});

const dialog = ref(false)

const vm = getCurrentInstance().proxy //다이얼로그관련

const userStore = useUserStore()
const t = useI18n().t; //다국어
const grd1 = ref(null);


const popParam = reactive({
  dataRow: '',
  fieldIndex: '',
})


//결재이력
const grdProps1 = reactive({
  fields: [
    { fieldName: "VEND_CD", dataType: "text", header: { text: t("협력사코드") }, editable: false },
    { fieldName: "VND_NAME", dataType: "text", header: { text: t("협력사명") },editable: false },
    { fieldName: "BIZ_REG_NO", dataType: "text", header: { text: t("BIZ_REG_NO") },editable: false,visible: false },
  ],
  columns: [],
  columnLayout: [
  ],
});
grdProps1.columns = grdProps1.fields;

let options = reactive({
  values: {
    CMPNY_DIV: userStore.cmpnyDiv,
    VND_NAME: '',
  },
})



//버튼 Event
const onButtonsClick = btn => { 
  if (btn.id === "btnClose") {
    onClose()
  } 
}


const onClose = () => {
  dialog.value = false
}




const openPopup = async () => {
  
  dialog.value = true 


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
    width="600"
    height="550"
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
    15일 이상 하이세스 단기공사 출입증 발급 담당자 정보
    </v-sheet>
    
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div>
          <strong>
            <br> 15일 이상의 공사는 협력사관리시스템(SCMS)에서 승인이 필요합니다. 
            <br> 아래 각 사업부 출입증 발급 담당자에게 승인을 요청해 주시길 바랍니다. <br> <br>
          </strong> 
          <div class="d-flex justify-center">
            <table>
              <thead style="background-color: rgba(180, 180, 180, 46.6%);">
                <tr>
                  <th scope="col" style="width: 20%;">
                    단기공사 <br> 승인 사업부
                  </th>
                  <th scope="col" style="width: 20%;">
                    발급 담당자
                  </th>
                  <th scope="col" style="width: 35%;">
                    담당자 등록부서
                  </th>
                  <th scope="col" style="width: 25%;">
                    연락처
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td >
                  조선, 범경영
                  </td>
                  <td >
                    정서인 S2 <br> 김태희 S2
                  </td>
                  <td >
                  동반성장지원부
                  </td>
                  <td >
                    T.2-5534 <br>  T.2-2584
                  </td>
                </tr> 
                <tr>
                  <td >
                  해양
                  </td>
                  <td >
                  박해림 사원
                  </td>
                  <td >
                  동반성장기획부
                  </td>
                  <td >
                    T.2-6189
                  </td>
                </tr> 
                <tr>
                  <td >
                  엔진
                  </td>
                  <td >
                  장윤정 사원
                  </td>
                  <td>
                  엔진기계인사총무지원부
                  </td>
                  <td >
                    T.2-7121
                  </td>
                </tr>  
                <tr>
                  <td >
                  군산
                  </td>
                  <td >
                  신지혜 S1
                  </td>
                  <td>
                  조선인사총무지원부
                  </td>
                  <td >
                    T.063-447-5396
                  </td>
                </tr>  
                <tr>
                  <td >
                  특수선
                  </td>
                  <td >
                  권지수 사원
                  </td>
                  <td>
                  특수선인사총무지원부
                  </td>
                  <td >
                    T.3-8924
                  </td>
                </tr>  
                <tr>
                  <td >
                  안전통합
                  </td>
                  <td >
                  이윤지 사원
                  </td>
                  <td>
                  자산운영부
                  </td>
                  <td >
                    T.3-3621
                  </td>
                </tr>  

              </tbody>
            </table>
          </div>
        </div>
      </v-card-text>
    </v-card>







    

  </v-dialog>
</template>


<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 250px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 550px;
    max-height: 550px;
    // overflow-y: auto;
  }



}


table,
th,
td {
  border: 1px solid rgba(0, 0, 0, 50%);
  border-collapse: collapse;
}

td{
  padding: 3px;
}

</style>
