<!-- 
  화면명   : Hi-SAFE 평가기준 KPI
  화면개요 : 각 프로세스마다 평가기준을 설명하는 화면
-->
<script setup>
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag"
import IGridTitle from "@/components/IGridTitle.vue"

const dialog = ref(false)

const openPopup = () => {
  dialog.value = true
}

const onButtonsClick = btn => {
  if (btn.id ==='btnClose') {
    dialog.value = false
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
    width="1200"
    height="900"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move justify-space-between"
      @mousedown="startDragging"
    >
      <span>Hi-SAFE 평가기준(KPI)</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="px-4 pt-2 pb-0 flex-column">
        <IGridTitle 
          ref="menuTitle"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
          class="ma-0 mb-2"
        />
      </v-card-title>
      <v-card-text class="pa-2 py-0 content-area">
        <v-sheet class="flex-column h-auto">
          <div>
            <p class="text-h6">1. 개선 등급 평가 기준(주제발표)</p>
            <p class="pl-4">1） 주제 등급 평가 절차 : <span class="text-decoration-underline font-weight-bold">1차(부서 자체) → 2차(사업부 안전) → 3차(안전경영부) → 최종집계(안전경영부)</span></p>
            <p class="pl-4">2） 주제 등급 평가 상세 기준</p>
            <p class="pl-8">- 주제의 <span class="font-weight-bold">위험성/경제성/난이도</span>를 각각 세부항목으로 평가하여 등급 구분</p>
          </div>
          <v-table>
            <thead>
              <tr>
                <th class="w-700 text-center text-textMain thBg" width="18%">등급</th>
                <th class="w-500 text-center text-textMain thBg">상세내용</th>
              </tr>
              <tr>
                <th class="w-700 text-center" width="18%">A등급</th>
                <td class="w-500 text-center">
                  <p>'상' 등급 2개 이상, '중' 등급 1개</p>
                </td>
              </tr>
              <tr>
                <th class="w-700 text-center" width="18%">B등급</th>
                <td class="w-500 text-center">
                  <p>'상' 등급 1개, '중' 등급 2개 or '중' 등급 3개</p>
                </td>
              </tr>
              <tr>
                <th class="w-700 text-center" width="18%">C등급</th>
                <td class="w-500 text-center">
                  <p>'중' 등급 2개, '하' 등급 1개</p>
                </td>
              </tr>
              <tr>
                <th class="w-700 text-center" width="18%">재선정</th>
                <td class="w-500 text-center">'하' 등급 2개 이상인 경우 주제 재선정</td>
              </tr>
            </thead>
          </v-table>
        </v-sheet>
        <v-sheet class="flex-column h-auto mt-4">
          <v-table>
            <thead>
              <tr>
                <th class="text-center text-textMain thBg" width="20%" rowspan="3">위험성</th>
                <th class="w-700 text-center text-textMain" width="10%">상</th>
                <th class="w-700 text-center text-textMain" width="10%">3</th>
                <th class="text-center text-textMain pa-2" rowspan="3">
                  <v-table>
                    <thead>
                      <tr>
                        <th class="w-700 text-center text-textMain thBg"></th>
                        <th class="w-700 text-center text-textMain thBg"><p>대(사망)</p></th>
                        <th class="w-700 text-center text-textMain thBg"><p>중(3일 이상 휴업사고)</p></th>
                        <th class="w-700 text-center text-textMain thBg"><p>소(경상)</p></th>
                      </tr>
                      <tr>
                        <th class="w-700 text-center text-textMain thBg"><p>상(높음)-1개월 1회(빈번)</p></th>
                        <th class="w-700 text-center text-textMain thBg"><p>3</p></th>
                        <th class="w-700 text-center text-textMain thBg"><p>3</p></th>
                        <th class="w-700 text-center text-textMain thBg"><p>2</p></th>
                      </tr>
                      <tr>
                        <th class="w-700 text-center text-textMain thBg"><p>중(보통)-6개월 1회(가끔)</p></th>
                        <th class="w-700 text-center text-textMain thBg"><p>3</p></th>
                        <th class="w-700 text-center text-textMain thBg"><p>2</p></th>
                        <th class="w-700 text-center text-textMain thBg"><p>1</p></th>
                      </tr>
                      <tr>
                        <th class="w-700 text-center text-textMain thBg"><p>하(낮음)-1년 1회(거의없음)</p></th>
                        <th class="w-700 text-center text-textMain thBg"><p>2</p></th>
                        <th class="w-700 text-center text-textMain thBg"><p>1</p></th>
                        <th class="w-700 text-center text-textMain thBg"><p>1</p></th>
                      </tr>
                    </thead>
                  </v-table>
                </th>
              </tr>
              <tr>
                <th class="w-700 text-center text-textMain" width="10%">중</th>
                <th class="w-700 text-center text-textMain" width="10%">2</th>
              </tr>
              <tr>
                <th class="w-700 text-center text-textMain" width="10%">하</th>
                <th class="w-700 text-center text-textMain" width="10%">1</th>
              </tr>

              <tr>
                <th class="text-center text-textMain thBg" width="20%" rowspan="3">
                  경제성<br/>
                  ※ 개선방법에 따라 변동
                </th>
                <th class="w-700 text-center text-textMain" width="10%">상</th>
                <th class="text-center text-textMain" colspan="2">
                  <p>해당 문제의 제거/보완 비용이 <span class="text-decoration-underline font-weight-bold">매년 1억원 이상</span>인 경우(현재 방법 기준)</p>
                </th>
              </tr>
              <tr>
                <th class="w-700 text-center text-textMain" width="10%">중</th>
                <th class="text-center text-textMain" colspan="2">
                  <p>해당 문제의 제거/보완 비용이 <span class="text-decoration-underline font-weight-bold">매년 3천만원 이상</span>인 경우(현재 방법 기준)</p>
                </th>
              </tr>
              <tr>
                <th class="w-700 text-center text-textMain" width="10%">하</th>
                <th class="text-center text-textMain" colspan="2">
                  <p>해당 문제의 제거/보완 비용이 <span class="text-decoration-underline font-weight-bold">매년 3천만원 미만</span>인 경우(현재 방법 기준)</p>
                </th>
              </tr>

              <tr>
                <th class="text-center text-textMain thBg" width="20%" rowspan="3">
                  난이도<br/>
                  ※ 개선목표수준에 따라 변동
                </th>
                <th class="w-700 text-center text-textMain" width="10%">상</th>
                <th class="text-center text-textMain" colspan="2">
                  <p>어려움(설계 변경과 공법 변경 등의 복합적인 개선이 필요한 주제)</p>
                </th>
              </tr>
              <tr>
                <th class="w-700 text-center text-textMain" width="10%">중</th>
                <th class="text-center text-textMain" colspan="2">
                  <p>보 통(문제가 특별히 어렵거나, 또는 너무 쉽지 않은 일반적인 개선 주제)</p>
                </th>
              </tr>
              <tr>
                <th class="w-700 text-center text-textMain" width="10%">하</th>
                <th class="text-center text-textMain" colspan="2">
                  <p>쉬 움(단순 투자로 개선이 가능한 주제)</p>
                </th>
              </tr>
            </thead>
          </v-table>
        </v-sheet>
        <v-sheet class="flex-column h-auto my-4">
          <div>
            <p class="text-h6">2. 상반기 평가 기준(중간발표)</p>
          </div>
          <v-table>
            <thead>
              <tr>
                <th class="text-center text-textMain thBg" colspan="2">과제 주제선정 등급</th>
                <th class="text-center text-textMain thBg" colspan="4">중간 평가(발표)</th>
                <th class="text-center text-textMain thBg" rowspan="2">비고</th>
              </tr>
              <tr>
                <th class="text-center text-textMain thBg">난이도 등급</th>
                <th class="text-center text-textMain thBg">배점 범위</th>
                <th class="text-center text-textMain thBg">개선 50% 이상 진행</th>
                <th class="text-center text-textMain thBg">개선 40% 진행</th>
                <th class="text-center text-textMain thBg">개선 30% 진행</th>
                <th class="text-center text-textMain thBg">개선 20% 이하 진행</th>
              </tr>
              <tr>
                <th class="text-center text-textMain">A급(상)</th>
                <th class="text-center text-textMain">40 ~ 100점</th>
                <th class="text-center text-textMain">100점</th>
                <th class="text-center text-textMain">80점</th>
                <th class="text-center text-textMain">60점</th>
                <th class="text-center text-textMain">40점</th>
                <th class="text-center text-textMain"></th>
              </tr>
              <tr>
                <th class="text-center text-textMain">B급(중)</th>
                <th class="text-center text-textMain">20 ~ 80점</th>
                <th class="text-center text-textMain">80점</th>
                <th class="text-center text-textMain">60점</th>
                <th class="text-center text-textMain">40점</th>
                <th class="text-center text-textMain">20점</th>
                <th class="text-center text-textMain"></th>
              </tr>
              <tr>
                <th class="text-center text-textMain">C급(하)</th>
                <th class="text-center text-textMain">0 ~ 60점</th>
                <th class="text-center text-textMain">60점</th>
                <th class="text-center text-textMain">40점</th>
                <th class="text-center text-textMain">20점</th>
                <th class="text-center text-textMain">0점</th>
                <th class="text-center text-textMain"></th>
              </tr>
            </thead>
          </v-table>
        </v-sheet>
        <v-sheet class="flex-column h-auto my-4">
          <div>
            <p class="text-h6">3. 하반기 평가 기준(결과발표)</p>
          </div>
          <v-table>
            <thead>
              <tr>
                <th class="text-center text-textMain thBg" colspan="2">과제 주제선정 등급</th>
                <th class="text-center text-textMain thBg" colspan="4">최종 평가(발표)</th>
                <th class="text-center text-textMain thBg" rowspan="2">비고</th>
              </tr>
              <tr>
                <th class="text-center text-textMain thBg">난이도 등급</th>
                <th class="text-center text-textMain thBg">배점 범위</th>
                <th class="text-center text-textMain thBg">개선 90% 이상 진행</th>
                <th class="text-center text-textMain thBg">개선 80% 진행</th>
                <th class="text-center text-textMain thBg">개선 70% 진행</th>
                <th class="text-center text-textMain thBg">개선 60% 이하 진행</th>
              </tr>
              <tr>
                <th class="text-center text-textMain">A급(상)</th>
                <th class="text-center text-textMain">40 ~ 100점</th>
                <th class="text-center text-textMain">100점</th>
                <th class="text-center text-textMain">80점</th>
                <th class="text-center text-textMain">60점</th>
                <th class="text-center text-textMain">40점</th>
                <th class="text-center text-textMain"></th>
              </tr>
              <tr>
                <th class="text-center text-textMain">B급(중)</th>
                <th class="text-center text-textMain">20 ~ 80점</th>
                <th class="text-center text-textMain">80점</th>
                <th class="text-center text-textMain">60점</th>
                <th class="text-center text-textMain">40점</th>
                <th class="text-center text-textMain">20점</th>
                <th class="text-center text-textMain"></th>
              </tr>
              <tr>
                <th class="text-center text-textMain">C급(하)</th>
                <th class="text-center text-textMain">0 ~ 60점</th>
                <th class="text-center text-textMain">60점</th>
                <th class="text-center text-textMain">40점</th>
                <th class="text-center text-textMain">20점</th>
                <th class="text-center text-textMain">0점</th>
                <th class="text-center text-textMain"></th>
              </tr>
            </thead>
          </v-table>
        </v-sheet>
        <v-sheet class="flex-column h-auto my-4">
          <div>
            <p class="text-h6">[개선 진행에 따른 개선율 평가 지표]</p>
          </div>
          <v-table>
            <thead>
              <tr>
                <th class="text-center text-textMain thBg" >단계</th>
                <th class="text-center text-textMain thBg" colspan="5">1.개선</th>
                <th class="text-center text-textMain thBg" colspan="2">2.분석</th>
                <th class="text-center text-textMain thBg">3.현상파악</th>
                <th class="text-center text-textMain thBg">4.문제정의</th>
              </tr>
              <tr>
                <th class="text-center text-textMain thBg">진행율</th>
                <th class="text-center text-textMain thBg">90%</th>
                <th class="text-center text-textMain thBg">80%</th>
                <th class="text-center text-textMain thBg">70%</th>
                <th class="text-center text-textMain thBg">60%</th>
                <th class="text-center text-textMain thBg">50%</th>
                <th class="text-center text-textMain thBg">40%</th>
                <th class="text-center text-textMain thBg">30%</th>
                <th class="text-center text-textMain thBg">20%</th>
                <th class="text-center text-textMain thBg">10%</th>
              </tr>
              <tr>
                <th class="text-center text-textMain">진행상세<br/>문서화</th>
                <th class="text-center text-textMain">목표 100%<br/>달성</th>
                <th class="text-center text-textMain">목표 80%<br/>달성</th>
                <th class="text-center text-textMain">목표 60%<br/>달성</th>
                <th class="text-center text-textMain">목표 40% 미만<br/>달성</th>
                <th class="text-center text-textMain">개선 방향<br/>확정</th>
                <th class="text-center text-textMain">위험원인<br/>분석완료</th>
                <th class="text-center text-textMain">위험원인<br/>분석진행</th>
                <th class="text-center text-textMain">위험/문제점<br/>파악</th>
                <th class="text-center text-textMain">위험 정의 및<br/>목표 수립</th>
              </tr>
            </thead>
          </v-table>
        </v-sheet>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">

// Header BackGround
.thBg{
  background-color: #e8eaf2;
}

// 테이블 내부선
// div.v-table__wrapper.v-table .v-table__wrapper > table > thead > tr > th, td {
//   border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity)); // 가로선
//   border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));  // 세로선
// }

// 최상단 테이블 헤더 내부선
//  {
//   // border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));  // 세로선
//   border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
// }

table {
  border-collapse: collapse;
}

th,td {
  width: 100px;
  height: 50px;
  text-align: center;
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  
  vertical-align: top;	/* 위 */
  vertical-align: bottom;   /* 아래 */
  vertical-align: middle;   /* 가운데 */
}


</style>