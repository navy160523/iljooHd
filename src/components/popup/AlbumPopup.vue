<script setup>
// import VueEasyLightbox from 'vue-easy-lightbox'
import IGridTitle from "@/components/IGridTitle.vue"
// import { OnLongPress } from "@vueuse/components"; 
// import { VCheckbox } from "vuetify/lib/components/index.mjs";
import request from "@/utils/request";
import Message from '@hiway/utils/notify'
import { useI18n } from 'vue-i18n'
import { commonDeletFilesApi } from "@/@hiway/api/commonFileApi"
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import IButtonList from '@/components/IButtonList.vue'

const props = defineProps({
  checkShow: {
    type: Boolean,
    default: false,
  },
  multi:{
    type: Boolean,
    default: true,
  },
  isOut: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['closePopup', 'selected'])
const dialog = ref(false)
const imgUrls = ref([])

const t = useI18n().t //다국어
const vm = getCurrentInstance().proxy //다이얼로그관련
const htmlRefOptions = ref(null)
const filePath = ref(null)
const totalSize = ref(null)
const contextPath = window.location.protocol + '//' + window.location.host

const openPopup = Url => { 
  filePath.value = Url
  searchImage(Url)
  dialog.value = true
}

const searchImage = Url => {
  // mobileImageDownloadApi(Url).then(res => {
  //   imgUrls.value = res.FILE_LIST
  //   totalSize.value = res.SIZE[0].TOTAL_SIZE
  //   prodArr.value = []
  // })
  request({
    url: '/hse/file/mobileImageDownload',
    headers: { "Content-Type": "application/json" },
    method: 'post',
    meta: {
      getContentDisposition: true,
      useErrorMessage: false,
    },
    data: Url,
  }).then(res => {
      console.log(res)
      imgUrls.value = res.FILE_LIST
      totalSize.value = res.SIZE[0].TOTAL_SIZE
      prodArr.value = []

      // res.FILE_LIST.forEach(async item => {
      //   const imageElement = new Image()

      //   imageElement.onload = async() => {

      //     const srcUrl = await getObjectURL(imageElement.src)
      //     const thumbnailUrl = await getThumbFile(imageElement)
        
      //     imgUrls2.push({
      //       src: srcUrl,
      //       thumbnail: thumbnailUrl,
      //       w: item.width,
      //       h: item.height,
      //     })
      //   }
      //   imageElement.src = getImage(item)
      // })
  })
}

const getThumbFile = image => {

  //canvas에 이미지 객체를 리사이징해서 담는 과정
  var canvas = document.createElement("canvas")
  canvas.width = '110' //리사이징하여 그릴 가로 길이
  canvas.height ='110' //리사이징하여 그릴 세로 길이
  canvas.getContext("2d").drawImage(image, 0, 0, '110', '110')

  //canvas의 dataurl를 blob(file)화 하는 과정
  var dataURL = canvas.toDataURL("image/png") //png => jpg 등으로 변환 가능

  return getObjectURL(dataURL)
}

const getObjectURL = item => {
  // console.log('getObjectURL', item)
  var byteString = atob(item.split(',')[1])
  var mimeString = item.split(',')[0].split(':')[1].split(';')[0]
  var ab = new ArrayBuffer(byteString.length)
  var ia = new Uint8Array(ab)
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }

  return window.URL.createObjectURL(new Blob([ab], { type: mimeString }))
}

const getImage = item => {
  let image = ''
  if(item.MIME_TYPE.indexOf('image') > -1) {
    return "data:"+ item.MIME_TYPE +";base64,"+item.BASE64
  } else if(item.MIME_TYPE.indexOf('video') > -1) {
    image = 'video'
  } else if(item.MIME_TYPE.indexOf('excel') > -1 || item.MIME_TYPE.indexOf('spreadsheetml') > -1) {
    image = 'excel'
  } else if(item.MIME_TYPE.indexOf('word') > -1) {
    image = 'word'
  } else if(item.MIME_TYPE.indexOf('powerpoint') > -1 || item.MIME_TYPE.indexOf('presentation') > -1 ) {
    image = 'ppt'
  } else if(item.MIME_TYPE.indexOf('pdf') > -1) {
    image = 'pdf'  
  } else {
    image = 'file'
  }
  
  return new URL(`/src/assets/images/mobile/${image}.png`, import.meta.url).href

}

const closePopup = () => {
  // before to close popup 
  // if (checkedData.length > 0) {
  //   checkedData = []
  // }

  checkShow.value = false
  dialog.value = false
  emit('closePopup')
}


const onImageClick = item => {
  // console.log('onImageClick',checkShow.value)
  if(!checkShow.value) {
    // console.log('onImageClick item', item)
    if(item.MIME_TYPE.indexOf('image') > -1) {
      imgsRef.value = [{ src: getImage(item), title: item.FILE_NAME }]
      onShow()
    } else {
      Message.err(t("xbuilder.msg.noSaveImage"))

      // showSecureDoc(item)
    }

  }
}

const visibleRef = ref(false)
const indexRef = ref(0) // default 0
const imgsRef = ref([])
const prodArr = ref([])
const checkShow = ref(props.checkShow)

const onLongPressCallbackComponent = e => {
  checkShow.value = !checkShow.value
  console.log(checkShow.value)
  prodArr.value = []
}

const onShow = () => {
  if(!checkShow.value)
    visibleRef.value = true
}

const onHide = () => (visibleRef.value = false)

const checked = target => {
  // if(!checkShow.value) {
  //   return 
  // }
  const index = prodArr.value.indexOf(target)
  
  return index >= 0 ? { checked: true } : { checked: false }
}

const onButtonsClick = btn => {
  if(btn.id === 'btnClose') {
    closePopup();

  }else if(btn.id === 'btnSelect') {    
    let selectedData = []

    if(prodArr.value.length === 0) {
      Message.err(t("선택한 데이터가 없습니다."))
      return
    }

    // 선택
    prodArr.value.forEach(idx => {
      selectedData.push(imgUrls.value[idx])
    })
    // console.log('selectedData :: ',selectedData)
    emit("selected", selectedData)
    closePopup();

  }else { // delete
    let data = []

    new deleteFlowHelper(vm, t)
      .setBefore(() => {
        let result = true
        // console.log('prodArr',prodArr.value)  
        if (prodArr.value.length === 0) {
          Message.err(t("선택한 데이터가 없습니다."))

          result = false
        }

        return result
      })
      .setQuery(() => {
        prodArr.value.forEach(index => {
          data.push(imgUrls.value[index])
        })
        data.forEach(item => {
          let filePath = '/user_home/xx08/HSE/HSE/' + item.FILE_PATH
          item.FILE_PATH = filePath
        })

        return commonDeletFilesApi(data)
      })
      .setAfter(() => {
        searchImage(filePath.value)
      })
      .run() 
  }
}

defineExpose({
  openPopup,
})
</script>

<template style="margin: 0px">
  <v-dialog
    v-model="dialog"
    persistent
    width="500"
    height="700"
    class="draggable-dialog"
    
  >
    <!-- @mousemove="handleDragging"
    @mouseup="stopDragging" -->

    <!-- @mousedown="startDragging" -->
    <div class="title-bar" >사진 선택</div>
    <v-container style="background-color: white; height: 700px;">
      <v-row>
        <v-col>
          <IGridTitle
            ref="menuTitle"
            :use-permission="false"
            :button-list="['btnDelete', 'btnSelect', 'btnClose']"
            @click-button="onButtonsClick"
          />
          <!-- <IGridTitle
            v-show="checkShow"
            ref="menuTitle"
            :button-list="['btnDelete','btnSelect']"
            @click-button="onButtonsClick"
          /> -->
        </v-col>
      </v-row>
      <v-row
        class="overflow-y-auto al"
        :class="{albumArea:checkShow}"
        width="100%"
        style="height: calc(100% - 50px)"
      >
        <v-col>
          <div
            class="albumWrap grid4fr"
            style="height: 160px; width: 100%;"
          >
            <template
              v-for="(item, index) in imgUrls"
              :key="index"
            >
              <div
                as="button"
                class="mx-2 mb-1"
                style="width: 100px; height: 160px;"
                :class="checked(index)"
              >
                <v-checkbox-btn
                  v-model="prodArr"
                  :value="index"
                  color="#0024ff"
                  class="checkImg"
                >
                  <template #label>
                    <img
                      :src="getImage(item)"
                      width="100px"
                      height="100px"
                    >
                  </template>
                </v-checkbox-btn>
                <!-- <template v-else>
                  <img
                    :src="getImage(item)"
                    width="100px"
                    height="100px"
                  >
                </template> -->
                <p class="fileName">
                  {{ item.FILE_NAME }}
                </p>
              </div>
            </template>
          </div>
          <!-- <vue-easy-lightbox
            :visible="visibleRef"
            :imgs="imgsRef"
            :index="indexRef"
            @hide="onHide"
          /> -->
          <IButtonList
            ref="refIButtonList"
                :usePermission="false"
            class="delBtn"
            :class="!checkShow ? 'isHide' : '' "
            :button-list="props.isOut ? ['btnDelete','btnSelect'] : ['btnDelete']"
            @click-button="onButtonsClick"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-dialog>
</template>

<style scoped lang="scss">
img {
  margin: 0;
}
.checkImg {
  position: relative !important;
  margin: 0;
  :deep(.v-selection-control) {
    justify-content: flex-start;
  }
  :deep(.v-selection-control__wrapper) {
    color: rgb(0, 36, 255) !important;
    position: absolute;
    top: 0;
  }
}

.checked .v-label > img {
  box-sizing: border-box;
  border: 3px solid rgb(0, 36, 255) !important;
}

.albumArea {
  block-size: calc(100% - 50px);
}

.isHide {
  display: none !important;
}

// .delBtn {
//   position: absolute;
//   inset-block-end: 18px;
//   margin-block: 0;
//   margin-inline: -16px;
//   padding-block: 0;
//   padding-inline: 10px;
// }

.albumWrap {
  display: grid;
  grid-template-columns: 1fr 1fr;

  &.grid3fr {
    grid-template-columns: repeat(3, 1fr);
  }

  &.grid4fr {
    grid-template-columns: repeat(4, 1fr);
  }

  &.grid5fr {
    grid-template-columns: repeat(5, 1fr);
  }
}

.fileName {
  width: 100%;
  height: 50px;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>