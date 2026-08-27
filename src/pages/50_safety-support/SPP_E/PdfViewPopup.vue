<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import IGridTitle from "@/components/IGridTitle.vue"
import { commonSearchApi } from "@hiway/api/commonApi"
import { commonDownloadFilesApi } from "@hiway/api/commonFileApi"
import { useI18n } from "vue-i18n"
import { upperCase } from "lodash-es"


const emit = defineEmits(["selected"])
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const dialog = ref(false)

const imgUrlTemp = ref([])

const commonDown = async file => {


  await commonSearchApi({ queryId: 'searchFile', param: file }).then( async res => {
    let max_id = res.ORESULT_CUR.length - 1
    console.log('max_id: ', max_id)
    if(upperCase(res.ORESULT_CUR[max_id].FILE_TYPE) === 'PDF'){
      await commonDownloadFilesApi(res.ORESULT_CUR[max_id]).then(res2 =>{
        // console.log(' file upload 2 ' , res2  )
        const blob = new Blob([res2], { type: 'application/pdf' })
        const imageURL = URL.createObjectURL(blob)

        imgUrlTemp.value.push(imageURL)
      })
    }else {
      vm.$swal({ 
        title: t('PDF파일이 아닙니다.'), 
        // showCancelButton: true,
        confirmButtonText: '확인',
      })
    }

  })
  
}

//메뉴버튼
const onButtonsClick = btn => {
  dialog.value = false
}

const openPopup = e => {
  dialog.value = true
  imgUrlTemp.value = []
  commonDown(e)
}

const onClose = () => {
  dialog.value = false
}

onMounted(() => {

})

defineExpose({
  openPopup,
})
</script>
<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="1100"
    height="950"
    class="p-absolute user-select-none"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
    >
      <span>PDF VIEWER</span>
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
        <div class="d-flex fill-height">
          <v-sheet class="h-auto">
            <iframe width="100%" height="100%" :src="imgUrlTemp[0]" class="object-fit-cover" />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>

  </v-dialog>
</template>