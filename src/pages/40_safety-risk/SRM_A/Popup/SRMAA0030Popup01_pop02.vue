
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from "vue"
import { useI18n } from "vue-i18n"
import IMenuTitle from "@/components/IMenuTitle.vue"
import Message from "@hiway/utils/notify"
import dayjs from "dayjs"

const menuTitle    = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t  = useI18n().t                //다국어

const emit = defineEmits(['close'])

const dialog = ref(false)

const openPopup = () => {

  dialog.value = true
}

const onButtonsClick = btn => {
  // emit('close')
  dialog.value = false
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
    width="550"
    height="170"
    class="p-absolute user-select-none"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
    >
      <span>개선 아이디어접수 [SOM]</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-3 pb-0">
        <!-- 기존 -->
        <IMenuTitle
          ref="menuTitle"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title> 
      <v-card-text class="pa-3 pt-0 content-area">
        <v-sheet>
          <div class="flex-column mt-2">
            S.O.M을 통한 개선 아이디어 요청 시, 담당자를 통해 검토 후 등록 될 예정입니다. <br/>
            담당자 : 안전경영부 유승훈 매니저 (2-3613)
          </div>
        </v-sheet>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>


<style scoped lang="scss">

</style>