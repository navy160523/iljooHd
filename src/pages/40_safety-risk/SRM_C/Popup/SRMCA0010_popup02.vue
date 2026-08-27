<!-- 
  화면명   : Hi-SAFE 주제등록/관리 위험등급 설명 팝업
  화면개요 : 약,중,고 위험에 대한 설명
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
      <span>위험등급</span>
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
          <v-table>
            <thead>
              <tr>
                <th class="w-700 text-center text-textMain thBg head_line"></th>
                <th class="w-700 text-center text-textMain thBg head_line">비치료</th>
                <th class="w-700 text-center text-textMain thBg head_line">휴업불필요<br/>(경미상)</th>
                <th class="w-700 text-center text-textMain thBg head_line">휴업필요<br/>(산재)</th>
                <th class="w-700 text-center text-textMain thBg head_line">중대성</th>
                <th class="w-700 text-center text-textMain thBg head_line">사망</th>
              </tr>
              <tr>
                <th class="w-700 text-center thBg head_line">매우 낮음</th>
                <td class="w-500 text-center lowRisk">저위험</td>
                <td class="w-500 text-center lowRisk">저위험</td>
                <td class="w-500 text-center lowRisk">저위험</td>
                <td class="w-500 text-center mediumRisk">중위험</td>
                <td class="w-500 text-center mediumRisk">중위험</td>
              </tr>
              <tr>
                <th class="w-700 text-center thBg head_line">낮음</th>
                <td class="w-500 text-center lowRisk">저위험</td>
                <td class="w-500 text-center lowRisk">저위험</td>
                <td class="w-500 text-center mediumRisk">중위험</td>
                <td class="w-500 text-center mediumRisk">중위험</td>
                <td class="w-500 text-center mediumRisk">중위험</td>
              </tr>
              <tr>
                <th class="w-700 text-center thBg head_line">보통</th>
                <td class="w-500 text-center lowRisk">저위험</td>
                <td class="w-500 text-center mediumRisk">중위험</td>
                <td class="w-500 text-center mediumRisk">중위험</td>
                <td class="w-500 text-center mediumRisk">중위험</td>
                <td class="w-500 text-center highRisk">고위험</td>
              </tr>
              <tr>
                <th class="w-700 text-center thBg head_line">높음</th>
                <td class="w-500 text-center mediumRisk">중위험</td>
                <td class="w-500 text-center mediumRisk">중위험</td>
                <td class="w-500 text-center mediumRisk">중위험</td>
                <td class="w-500 text-center highRisk">고위험</td>
                <td class="w-500 text-center highRisk">고위험</td>
              </tr>
              <tr>
                <th class="w-700 text-center thBg head_line">매우 높음</th>
                <td class="w-500 text-center mediumRisk">중위험</td>
                <td class="w-500 text-center mediumRisk">중위험</td>
                <td class="w-500 text-center highRisk">고위험</td>
                <td class="w-500 text-center highRisk">고위험</td>
                <td class="w-500 text-center highRisk">고위험</td>
              </tr>
            </thead>
          </v-table>
        </v-sheet>
        <v-sheet class="flex-column h-auto mt-4">
          <v-table>
            <thead>
              <tr>
                <th class="w-700 text-center text-textMain thBg" width="10%">점수</th>
                <th class="w-700 text-center text-textMain thBg" width="30%">구분</th>
                <th class="w-700 text-center text-textMain thBg">중대성(강도) 판정기준</th>
              </tr>
              <tr>
                <th class="w-700 text-center text-textMain">1</th>
                <th class="text-center">비치료<br/>(응급처치)</th>
                <th>
                  ■ 의사의 치료가 필요없는 경우로 응급처치 후 복귀가 가능한 부상<br/>
                  ■ 물적피해 금액이 100만원 미만일 경우 
                </th>
              </tr>
              <tr>
                <th class="w-700 text-center text-textMain">2</th>
                <th class="text-center">휴업불필요<br/>(경미상)</th>
                <th>
                  ■ 응급조치 이상의 치료가 필요하지만 산재 요양신청 대상이 아닌 경미한 부상<br/>
                  ■ 휴업일수가 휴일 포함 3일 미만인 경우(사고 발생일 제외)<br/>
                  ■ 물적피해 금액이 100 ~ 1000만원일 경우
                </th>
              </tr>
              <tr>
                <th class="w-700 text-center text-textMain">3</th>
                <th class="text-center">휴업필요<br/>(산재)</th>
                <th>
                  ■ 산업재해 요양신청 대상으로 일정기간 이상 휴업을 요하는 부상<br/>
                  ■ 휴업일수가 휴일 포함 3일 이상인 경우(사고 발생일 제외)<br/>
                  ■ 물적피해 금액이 1000만원 ~ 1억원일 경우
                </th>
              </tr>
              <tr>
                <th class="w-700 text-center text-textMain">4</th>
                <th class="text-center">중대성</th>
                <th>
                  ■ 산재 요양 대상으로 휴업일수가 3개월 이상인 경우<br/>
                  ■ 회사 기준에 따라 중대성 사고로 분류된 경우<br/>
                  ■ 물적피해 금액이 1억원 ~ 10억원일 경우
                </th>
              </tr>
              <tr>
                <th class="w-700 text-center text-textMain">5</th>
                <th class="text-center">사망</th>
                <th>
                  ■ 사망 또는 다수의 근로불능이 발생하는 경우<br/>
                  ■ 물적피해 금액이 10억을 초과하는 경우
                </th>
              </tr>
            </thead>
          </v-table>
        </v-sheet>
        <v-sheet class="flex-column h-auto my-4">
          <v-table>
            <thead>
              <tr>
                <th class="w-700 text-center text-textMain thBg" width="10%">점수</th>
                <th class="w-700 text-center text-textMain thBg" width="30%">구분</th>
                <th class="w-700 text-center text-textMain thBg">빈도 판정기준</th>
              </tr>
              <tr>
                <th class="w-700 text-center text-textMain">1</th>
                <th class="text-center">매우낮음</th>
                <th>
                  ■ 사고 발생 가능성이 희박한 경우<br/>
                  ■ 최근 1년 이내 사고가 발생한 사실이 없는 경우<br/>
                  ■ 최근 1년 이내 아차사고가 1건도 발생되지 않은 경우
                </th>
              </tr>
              <tr>
                <th class="w-700 text-center text-textMain">2</th>
                <th class="text-center">낮음</th>
                <th>
                  ■ 사고 발생 가능성이 낮은 경우<br/>
                  ■ 최근 1년 이내 사고 즉보가 1건 발생한 경우<br/>
                  ■ 최근 1년 이내 아차사고가 3건 미만 발생한 경우
                </th>
              </tr>
              <tr>
                <th class="w-700 text-center text-textMain">3</th>
                <th class="text-center">보통</th>
                <th>
                  ■ 사고 발생 가능성이 있는 경우<br/>
                  ■ 최근 1년 이내에 사고 즉보가 2건 발생한 경우<br/>
                  ■ 최근 1년 이내 아차사고가 3건 ~ 6건 발생한 경우
                </th>
              </tr>
              <tr>
                <th class="w-700 text-center text-textMain">4</th>
                <th class="text-center">높음</th>
                <th>
                  ■ 사고 발생 가능성이 높은 경우<br/>
                  ■ 최근 1년 이내에 사고 즉보가 3건 ~ 4건 발생한 경우<br/>
                  ■ 최근 1년 이내 아차사고가 7건 ~ 12건 발생한 경우
                </th>
              </tr>
              <tr>
                <th class="w-700 text-center text-textMain">5</th>
                <th class="text-center">매우높음</th>
                <th>
                  ■ 사고 발생 가능성 매우 높은 경우<br/>
                  ■ 최근 1년 이내에 사고 즉보가 5건 이상 발생한 경우<br/>
                  ■ 최근 1년 이내 아차사고가 13건 이상 발생한 경우
                </th>
              </tr>
            </thead>
          </v-table>
        </v-sheet>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
// 저위험
.lowRisk {
  color: #FFDC3C;
}

// 중위험
.mediumRisk {
  color: #FF8200;
}

// 고위험
.highRisk {
  color: red;
}

// Header BackGround
.thBg{
  background-color: #e8eaf2;
}

// 테이블 내부선
div.v-table__wrapper.v-table .v-table__wrapper > table > thead > tr > th, td {
  border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity)); // 가로선
  border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));  // 세로선
}

// 최상단 테이블 헤더 내부선
.head_line {
  border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));  // 세로선
}

</style>