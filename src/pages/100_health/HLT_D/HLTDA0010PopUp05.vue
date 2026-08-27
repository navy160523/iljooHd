<!--     일주지앤에스 SI2팀 김성근    -->
<!--  프로그램명 : 유틸리티 라인 MSDS  -->

<script setup>
import { ref } from 'vue'
import IMenuTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@hiway/stores/user'

const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const emit = defineEmits(['selected', 'upDataRow'])
const menuTitle = ref(null);
const dialog = ref(false);

// 조회조건

const openPopup = (param) => {
  dialog.value = true
}



const onButtonsClick = (btn) => {
  if (btn.id === 'btnClose') {
    closePopup()
  } 
}

const closePopup = () => {
  dialog.value = false
}

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog
    v-model="dialog"
    persistent
    width="1200"
    height="550"
    class="draggable-dialog"
  >
    <div class="title-bar">
      <span> 화학물질 규제 기준 확인 </span>
    </div>
    <v-card>
      <v-card-title>
        <IMenuTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>

      <v-card-text class="pa-2 pa-0 content-area">
        <v-sheet class="d-flex flex-column fill-height">
          <v-sheet class="pa-0 mt-2 h-auto">
            <div>
              <table class="regulation-table">
                <thead>
                  <tr>
                    <td>관리 분류</td>
                    <td>분류 기준</td>
                    <td>해당 분류</td>
                    <td>적용 법령</td>
                    <td>표기</td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td rowspan="2">금지</td>
                    <td rowspan="2">어떠한 경우에도 사내 반입/취급 할 수 없는 물질(제품)</td>
                    <td>제조등금지물질<br />허가대상물질</td>
                    <td>산업안전보건법</td>
                    <td rowspan="2">금지</td>
                  </tr>
                  <tr>
                    <td>금지물질</td>
                    <td>화학물질관리법</td>
                  </tr>
                  <tr>
                    <td rowspan="4">제한</td>
                    <td rowspan="4">대부분의 경우에 사내 반입/취급 할 수 없으나 공정상 필수 불가결할 경우 보건/환경 관리 부서의 허가를 받고 사용하여야 하는 물질(제품)</td>
                    <td>특별관리물질</td>
                    <td>산업안전보건법</td>
                    <td>특별</td>
                  </tr>
                  <tr>
                    <td>유독물질</td>
                    <td>화학물질관리법</td>
                    <td>유독</td>
                  </tr>
                  <tr>
                    <td>사고대비물질</td>
                    <td>화학물질관리법</td>
                    <td>사고</td>
                  </tr>
                  <tr>
                    <td>제한물질</td>
                    <td>화학물질관리법</td>
                    <td>제한</td>
                  </tr>
                  <tr>
                    <td rowspan="2">관심</td>
                    <td rowspan="2">사내 반입/취급 제한은 없으나 취급/보관 시 보호구, 환기 등 적정 조치를 갖추어야 하는 물질(제품)</td>
                    <td>허용기준설정물질</td>
                    <td>산업안전보건법</td>
                    <td>허용</td>
                  </tr>
                  <tr>
                    <td>관리대상유해물질</td>
                    <td>산업안전보건법</td>
                    <td>관리</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </v-sheet>
        </v-sheet>
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style scoped>
.popup-container {
  padding: 20px;
  background-color: #fff;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  border: 1px solid #ccc;
  border-radius: 10px;
}
.popup-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
  text-align: center;
}
table thead {
  background-color: #f8f8f8;
}

.regulation-table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
}

.regulation-table th,
.regulation-table td {
  border: 1px solid #ddd;
  padding: 10px;
  font-size: 14px;
}

.mark {
  font-weight: bold;
  font-size: 16px;
}
.mark.red {
  color: red;
}

.mark.orange {
  color: orange;
}

.mark.blue {
  color: blue;
}

.mark.green {
  color: green;
}
</style>