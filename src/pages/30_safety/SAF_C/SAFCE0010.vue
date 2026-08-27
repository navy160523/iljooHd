<!-- si3팀 김현재 중대(성)사고 재발방지대책 이행정검
점검 체크리스트 관리 -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import SAFCE0010Popup from './SAFCE0010Popup.vue'
import SAFCE0010Tab01 from './SAFCE0010Tab01.vue'

defineOptions({
  name: '30_safety-SAF_C-SAFCE0010',
})
//변수선언부 시작
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const UserStore = useUserStore()
const tab = ref('점검항목등록')
const sAFCE0010Tab01 = ref(null)

//변수선언부 끝

onMounted(() => {})

//메뉴버튼
const onButtonsClick = (btn) => {
  if (tab.value === '점검항목등록') {
    sAFCE0010Tab01.value.onButtonsClick({ id: btn.id })
  }
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="mb-2">
          <v-tabs v-model="tab">
            <v-tab value="점검항목등록">점검항목등록</v-tab>
            <v-tab :disabled="true" value="중대사고 맵핑">중대사고 맵핑</v-tab>
          </v-tabs>
        </v-sheet>
        <v-window v-model="tab" class="h-window">
          <v-window-item value="점검항목등록">
            <SAFCE0010Tab01 ref="sAFCE0010Tab01"></SAFCE0010Tab01>
          </v-window-item>
          <v-window-item value="중대사고 맵핑">
            <span>보류</span>
          </v-window-item>
        </v-window>
      </div>
    </v-card-text>
  </v-card>
</template>
