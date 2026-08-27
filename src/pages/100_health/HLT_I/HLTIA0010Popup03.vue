<script setup>
import IGridTitle from "@/components/IGridTitle.vue"
import { ref, defineProps, computed } from "vue";
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { useUserStore } from '@hiway/stores/user'
import queryFlowHelper from '@/utils/searchFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import TAB01 from "./HLTIA0010_TAB01.vue"

const dialog = ref(false)
const menuTitle = ref(null)
const BSNS_CD = ref("");
const DEPT_CD = ref("");
const userStore = useUserStore()
const organizationData = ref([]);
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)

const tab = ref("safety")

const orga = ref(null)
const pay = ref(null)

const openPopup3 = (bsns, dept) => {
  BSNS_CD.value = bsns;  // 부모에서 전달된 사업부 코드 저장
  DEPT_CD.value = dept;
  dialog.value = true;
  // console.log(BSNS_CD.value);
  // console.log(DEPT_CD.value);
}
const closePopup = () => {
  dialog.value = false;
}

defineExpose({
  openPopup3,
})


const onButtonsClick = (btn) => {
  if (btn.id === "btnClose") {
    closePopup()
  }
}

</script>

<template>
<v-dialog
    v-model="dialog"
    eager
    persistent
    width="1500"
    class="p-absolute user-select-none"
  >
  <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
    >
    <span>결제창</span>
    </v-sheet>

    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <!-- 닫기버튼 -->
        <IGridTitle
          ref="menuTitle"
          :use-permission="false"
          :button-list="['btnPreview', 'btnReqApply', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>

      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="appTitle">
              <span>결제 제목</span>
              <i-input
                v-model="saveParam"
                width="500px"
              />
            </div>
          </v-sheet>
        </div>

        <v-sheet>
        <v-tabs v-model="tab">
          <v-tab value="orga">조직도</v-tab>
          <v-tab value="pay">결제선 보관함</v-tab>
        </v-tabs>
      </v-sheet>
      <TAB01 ref="orga" v-if="tab == 'orga'"></TAB01>
      <TAB02 ref="pay" v-else-if="tab == 'pay'"></TAB02>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style lang="scss">
  .appTitle {
    display: flex;
    align-items: left;
    flex-direction: column;
  }
</style>
