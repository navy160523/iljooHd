
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useCommonStore } from "@hiway/stores/common"
import { useRoute , useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import IMenuTitle from "@/components/IMenuTitle.vue"

const userStore    = useUserStore()
const userLogStore = useLogsStore()
const commonStore = useCommonStore()
const route = useRoute()
const menuTitle    = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t  = useI18n().t                //다국어
const router = useRouter()

const emit = defineEmits(['close'])

const dialog = ref(false)

const openPopup = () => {

  dialog.value = true
}

const onButtonsClick = btn => {
  emit('close')
  dialog.value = false
}

const linkMove = () => {
  commonStore.loading = true
  router.push('/40_safety-risk/SRM_C/SRMCA0020').finally(() => {
    commonStore.loading = false
    emit('close')
    dialog.value = false
  })
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
    height="200"
    class="p-absolute user-select-none"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
    >
      <span>HiSAFE 개선 추진</span>
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
          <div class="flex-column">
            HISAFE를 통한 개선 추진 시, HiSAFE 과제등록 후 진행이 가능합니다.
          </div>
          <div class="mt-2">
            링크 : <a @click="linkMove" class="cursor-pointer">HISAFE 바로가기</a>
          </div>
        </v-sheet>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>


<style scoped lang="scss">

</style>