<!--
  화면명 : 안전점검 유형별 설명서
  화면개요 : 안전점검 유형별 설명서
  최종수정일자: 2025-03-14
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
    width="1300"
    height="800"
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
     고위험 점검 유형 및 점검그룹 설명서 
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
            <br> <span style="font-size: large;">[1] 고위험 점검 유형 설명 </span><br>
          </strong> 
          <div class="d-flex justify-center flex-column">
            <table style="width: 1200px; margin-left: 10px; margin-top: 10px;" >
              <thead style="background-color: rgba(180, 180, 180, 46.6%);">
                <tr>
                  <th scope="col" style="width: 20%;">
                    점검 유형
                  </th>
                  <th scope="col" style="width: 30%;">
                    설명
                  </th>
                  <th scope="col" style="width: 20%;">
                    3중점검 여부
                  </th>
                  <th scope="col" style="width: 30%;">
                    점검 제외 조건
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="text-align: left; font-weight: bold;">
                    모바일작업지시(PTW연계)
                  </td>
                  <td class='leftalign'>
                    <strong>PTW를 연계하여 모바일작업지시를 발행한 건</strong>
                  </td>
                  <td >
                    PTW의 허가등급에 따라 결정<strong>＊</strong>
                  </td>
                  <td class='leftalign'>
                    ① PTW 승인취소/안전허가반려 (모든 일정 제외)<br>
                    ② PTW 일정 제외(해당일 제외)<br>
                    ③ 모바일작업지시 작업 취소

                  </td>

                </tr> 
                <tr>
                  <td style="text-align: left; font-weight: bold;">
                    PTW(단기공사)
                  </td>
                  <td class='leftalign'>
                    <strong>단기공사 PTW 승인 건</strong>
                  </td>
                  <td >
                    3중점검 비대상(부서자율점검)
                  </td>
                  <td class='leftalign'>
                    ① PTW 승인취소/안전허가반려 (모든 일정 제외)<br>
                    ② PTW 일정 제외(해당일 제외)
                  </td>
                </tr> 
               
                <tr>
                  <td style="text-align: left; font-weight: bold;">
                    PTW(출력물QR)
                  </td>
                  <td class='leftalign'>
                    <strong>작업지시 미연계 상태에서 PTW 출력물을 통해 QR점검이 이루어진 건</strong>
                    <br> : 추후 작업지시가 생성되어도 남아있게 되므로 주의 바랍니다.
                  </td>
                  <td>
                    PTW의 허가등급에 따라 결정<strong>＊</strong>
                  </td>
                  <td class='leftalign'>
                    ① PTW 승인취소/안전허가반려 (모든 일정 제외)<br>
                    ② PTW 일정 제외(해당일 제외)
                  </td>
                </tr> 
                <tr>
                  <td style="text-align: left; font-weight: bold;">
                    PTW(특수선)
                  </td>
                  <td class='leftalign'>
                    <strong>특수선 PTW 승인 건</strong>
                    <br> : 특수선의 경우 PTW 승인 즉시 점검 계획으로 잡힙니다.
                  </td>
                  <td>
                    PTW의 허가등급에 따라 결정<strong>＊</strong>
                  </td>
                  <td class='leftalign'>
                    ① PTW 승인취소/안전허가반려 (모든 일정 제외)<br>
                    ② PTW 일정 제외(해당일 제외)
                  </td>
                </tr> 
                <tr>
                  <td style="text-align: left; font-weight: bold;">
                    엔진 고위험
                  </td>
                  <td class='leftalign'>
                    <strong> 엔진기계사업부 고위험 점검 </strong>
                    <br> : 엔진기계사업부에서 모바일작업지시서에 점검 대상인 작업표준을 첨부 시
                  </td>
                  <td>
                    작업표준의 점검 구분 정보(3중 점검, 부서자율점검, 해당 없음)에 따라 결정
                  </td>
                  <td class='leftalign'>
                    ① 모바일 작업지시에서 3중 점검 대상이 아닌 표준서로 바꾸었을 때
                    <br> ② 모바일작업지시 작업 취소
                  </td>
                </tr> 

              </tbody>
            </table>

            <div style="width: 1200px; margin-bottom: 20px; margin-left: 10px;" >
              <strong>＊PTW의 허가등급에 따라 결정</strong>
              <br>  &nbsp;① 안전대면허가/안전현장허가  &nbsp; → &nbsp; 3중점검 대상
              <br>  &nbsp;② 전산허가 &nbsp; →  &nbsp; 부서자율점검(3중점검 비대상)
            </div>  

            <strong>
               <span style="font-size: large;">[2] 점검 완료 기준 </span> <br> 
            </strong> 

            <table style="width: 1200px; margin-left: 10px;  margin-top: 10px; margin-bottom: 10px;">
              <thead style=" background-color: rgba(180, 180, 180, 46.6%);">
                  <tr>
                      <th rowspan="2" style="width: 20%;">점검 구분</th>
                      <th rowspan="2" style="width: 20%;">점검 현황</th>
                      <th colspan="4" style="width: 20%;">점검 주체</th>
                  </tr>
                  <tr>
                      <th style="width: 15%;">안전요원</th>
                      <th style="width: 15%;">관리감독자<br>/협력사 관리감독자</th>
                      <th style="width: 15%;">세잎클로버<br>/협력사 안전관리자</th>
                      <th style="width: 15%;">기타</th>
                  </tr>
              </thead>
              <tbody>
                  <tr>
                      <td rowspan="3">3중 점검</td>
                      <td>점검 미완료</td>
                      <td colspan="4">X</td>
                  </tr>
                  <tr>
                      <td>점검 진행중</td>
                      <td colspan="4" >1명이라도 점검 실시</td>
                  </tr>
                  <tr>
                      <td>점검 완료</td>
                      <td>O</td>
                      <td>O</td>
                      <td colspan="2">1명이라도 점검 실시 <br> <span style="font-size: small; color: red;">( ※ 세잎클로버/협력사안전관리자가 없으면 기타 그룹도 인정 ) </span> </td>
                  </tr>
                  <tr>
                      <td rowspan="2">3중 점검 비대상(부서자율점검)</td>

                      <td>점검 미완료</td>
                      <td rowspan="2"> - </td>
                      <td colspan="4">X</td>
                  </tr>
                  <tr>
                      <td>점검 완료</td>
                      <td colspan="4">1명이라도 점검 실시</td>
                  </tr>
              </tbody>
          </table>

          <div style="width: 1200px; margin-bottom: 10px; margin-left: 10px;" class = "d-flex justify-end">
            O: 점검 실시 &nbsp;&nbsp; X: 점검 미실시 &nbsp;&nbsp; -: 해당없음(점검주체 아님)
          </div>
          
      

          <div style="margin-bottom: 10px; margin-left: 10px;">
              <strong> ※ 점검그룹 설명 </strong>
              
              <br> &nbsp; <span  style="text-decoration: underline; margin-bottom: 2px;" >점검그룹의 기준은 아래와 같으며, ①에서 ⑥까지 우선 해당하는 그룹으로 인정되어 점검 결과가 집계됩니다. </span>
                <br>  ① 안전요원:  &nbsp; 인사조직 기준 안전부서 인원
                <br>  ② 세잎클로버: &nbsp; [운영관리-담당자관리-부서별담당자관리] 기준
                <br>  ③ 협력사 안전관리자:  &nbsp; 전산 상 협력사 안전관리자 선임 관리 대상 (안전조직에서 관리 / 특수선안전과 이상현 책임)
                <br>  ④ 직영 관리감독자: &nbsp; 인사조직 기준 직책자  ( `25년 4월 28일부, 일반 사무기술직 인원은 기타 그룹으로 조정 )
                <br>  ⑤ 협력사 관리감독자:  &nbsp; [운영관리-담당자관리-부서별담당자관리] 기준 또는 모바일작업지시의 협력사관리감독자 
                <br>  ⑥ 기타: &nbsp; 그 외 모든 인원 <br>
          </div>  


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
  vertical-align: middle;
  text-align: center ;
}

td{
  padding: 3px;
}


/* 가운데 정렬 테이블 */
.leftalign {
  text-align: left;
}



</style>
