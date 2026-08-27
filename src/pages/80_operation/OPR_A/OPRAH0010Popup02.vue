<!-- 
  * Vue 내 용 : 설문지 미리보기
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/02/28
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/02/28 
-->

<script setup>
import { ref, reactive, onMounted } from "vue"
import IGridTitle from "@/components/IGridTitle.vue"
import { commonSearchApi } from '@hiway/api/commonApi'
import { commonDownloadFilesApi } from "@hiway/api/commonFileApi"
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import _ from "lodash"
import { isEmpty } from "@/@core/utils"

const dialog = ref(false)

const popupParams = reactive({
  CMPNY_DIV : '',
  SUVY_ID : '',
  TITLE : '',
  SUVY_DESC : '',
  QSTN_TYPE : '',
  REG_YN: '',
  DEPT_YN: '',
})

const questionParam = ref([])

const openPopup = val => {  
  popupParams.CMPNY_DIV = val.CMPNY_DIV
  popupParams.SUVY_ID = val.SUVY_ID
  popupParams.TITLE = val.TITLE
  popupParams.SUVY_DESC = val.SUVY_DESC
  popupParams.REG_YN = val.REG_YN
  popupParams.DEPT_YN = val.DEPT_YN

  createPreview()

  dialog.value = true
}

const onClose = () => {
  clearRegion()
  dialog.value = false
}

defineExpose({
  openPopup,
})

const onButtonsClick = btn => {
  if (btn.id === 'btnClose')
  {
    onClose()
  }
}

const createPreview = async () => {
  let resVal = []
  await Promise.all([commonSearchApi({ queryId: "OPRAH0010_SEARCH_03", param: {SUVY_ID: popupParams.SUVY_ID } })]).then(res => {
    resVal = res[0].ORESULT_CUR
  })
  for(var quest of resVal) {
      const question = {
        TITLE: quest.QSTN_TITLE,
        DESC: quest.QSTN_DESC,
        inputParam: [],
        textParam: [],
        fileParam: [],
        singleSelParam: [],
        multiSelParam: [],
        preferenceParam: [],
      }

      if (quest.QSTN_TYPE === 'A') {
        const newElement = {
          description: quest.QSTN_CONTENTS,
        }
        question.inputParam.push(newElement)
      } else if (quest.QSTN_TYPE === 'B') {
        const newElement = {
          description: quest.QSTN_CONTENTS,
        }
        question.textParam.push(newElement)
      } else if (quest.QSTN_TYPE === 'C') {
        let rslt = []
        Promise.all([commonSearchApi({ queryId: "searchFile", param: {
          CMPNY_DIV: popupParams.CMPNY_DIV, FILE_ID: quest.QSTN_CONTENTS } })]).then(res => {
            rslt = res
        })
        if(rslt == null) {
          question.fileParam.push({addfile: ''})
        } else if(rslt.length <= 0) {
          question.fileParam.push({addfile: ''})
        } else if(rslt[0].ORESULT_CUR) {
          for(let i of rslt[0].ORESULT_CUR){ 
            await commonDownloadFilesApi(i).then(resFile=>{
              question.fileParam.push({addfile: URL.createObjectURL(new Blob([resFile]))})
            }).catch(e => {
              question.fileParam.push({addfile: '' })
            })
          }
        }
      } else if (quest.QSTN_TYPE === 'D') {
        const content1 = quest.QSTN_CONTENTS.split('|')
        let strDescription1 = ''
        let strDescription2 = ''
        let strAddFile = ''

        // 저장된 문항 값이 여러 개 있을 경우
        if (content1.length > 0) {
          for (let i = 0; i < content1.length; i++) {
            const content2 = content1[i].split('&')

            strDescription1 = ''
            strDescription2 = ''
            strAddFile = ''
            for (let j = 0; j < content2.length; j++) {
              if (j === 0) {
                strDescription1 = content2[j]
              } else if (j === 1) {
                strDescription2 = content2[j]
              } else if (j === 2) {
                strAddFile = content2[j]
              }
            }

            if (isEmpty(strAddFile))
            {
              const newParam = {
                description1: strDescription1,
                description2: strDescription2,
              }

              question.singleSelParam.push(newParam)
            } else {
              let rslt = []
              await Promise.all([commonSearchApi({ queryId: "searchFile02", param: {
                CMPNY_DIV: popupParams.CMPNY_DIV, FILE_ID: strAddFile, DESC1: strDescription1, DESC2: strDescription2 } })]).then(res => {
                rslt = res
              })
              if(rslt == null) {
                question.singleSelParam.push({description1: strDescription1, description2: strDescription2,addfile: ''})
              } else if(rslt.length <= 0) {
                question.singleSelParam.push({description1: strDescription1, description2: strDescription2,addfile: ''})
              } else if(rslt[0].ORESULT_CUR) {
                for(let i of rslt[0].ORESULT_CUR){ 
                  await commonDownloadFilesApi(i).then(resFile=>{
                    question.singleSelParam.push({description1: i.DESC1, description2: i.DESC2, addfile: URL.createObjectURL(new Blob([resFile]))})
                  }).catch(e => {
                    question.singleSelParam.push({description1: i.DESC1, description2: i.DESC2, addfile: '' })
                  })
                }
              }
            }
          }
        } else {
          const content = quest.QSTN_CONTENTS.split('&')

          // 저장된 문항 값이 1개 있을 경우
          if (content.length > 0) {
            for (let i=0; i < content.length; i++) {
              if (i === 0) {
                strDescription1 = content[i]
              }
              else if (i === 1) {
                strDescription2 = content[i]
              }
              else if (i === 2) {
                strAddFile = content[i]
              }
            }
          } else {
            strDescription1 = ''
            strDescription2 = ''
            addFile = ''
          }

          if (isEmpty(strAddFile))
          {
            const newParam = {
              description1: strDescription1,
              description2: strDescription2,
            }

            question.singleSelParam.push(newParam)
          } else {
            let rslt = []
            await Promise.all([commonSearchApi({ queryId: "searchFile02", param: {
              CMPNY_DIV: popupParams.CMPNY_DIV, FILE_ID: strAddFile, DESC1: strDescription1, DESC2: strDescription2 } })]).then(res => {
                rslt = res
            })
            if(rslt == null) {
              question.singleSelParam.push({description1: strDescription1, description2: strDescription2,addfile: ''})
            } else if(rslt.length <= 0) {
              question.singleSelParam.push({description1: strDescription1, description2: strDescription2,addfile: ''})
            } else if(rslt[0].ORESULT_CUR) {
              for(let i of rslt[0].ORESULT_CUR){ 
                await commonDownloadFilesApi(i).then(resFile=>{
                  question.singleSelParam.push({description1: i.DESC1, description2: i.DESC2, addfile: URL.createObjectURL(new Blob([resFile]))})
                }).catch(e => {
                  question.singleSelParam.push({description1: i.DESC1, description2: i.DESC2, addfile: '' })
                })
              }
            }
          }
        }
      } else if (quest.QSTN_TYPE === 'E') {
        const content1 = quest.QSTN_CONTENTS.split('|')
        let strDescription1 = ''
        let strDescription2 = ''
        let strAddFile = ''

        // 저장된 문항 값이 여러 개 있을 경우
        if (content1.length > 0) {
          for (let i = 0; i < content1.length; i++) {
            const content2 = content1[i].split('&')

            strDescription1 = ''
            strDescription2 = ''
            strAddFile = ''
            for (let j = 0; j < content2.length; j++) {
              if (j === 0) {
                strDescription1 = content2[j]
              } else if (j === 1) {
                strDescription2 = content2[j]
              } else if (j === 2) {
                strAddFile = content2[j]
              }
            }

            if (isEmpty(strAddFile))
            {
              const newParam = {
                description1: strDescription1,
                description2: strDescription2,
              }
              question.multiSelParam.push(newParam)
            } else {
              let rslt = []
              await Promise.all([commonSearchApi({ queryId: "searchFile02", param: {
                CMPNY_DIV: popupParams.CMPNY_DIV, FILE_ID: strAddFile, DESC1: strDescription1, DESC2: strDescription2 } })]).then(res => {
                  rslt = res
              })
              if(rslt == null) {
                question.multiSelParam.push({description1: strDescription1, description2: strDescription2,addfile: ''})
              } else if(rslt.length <= 0) {
                question.multiSelParam.push({description1: strDescription1, description2: strDescription2,addfile: ''})
              } else if(rslt[0].ORESULT_CUR) {
                for(let i of rslt[0].ORESULT_CUR){ 
                  await commonDownloadFilesApi(i).then(resFile=>{
                    question.multiSelParam.push({description1: i.DESC1, description2: i.DESC2, addfile: URL.createObjectURL(new Blob([resFile]))})
                  }).catch(e => {
                    question.multiSelParam.push({description1: i.DESC1, description2: i.DESC2, addfile: ''})
                  })
                }
              }
            }
          }
        } else {
          const content = quest.QSTN_CONTENTS.split('&')

          // 저장된 문항 값이 1개 있을 경우
          if (content.length > 0) {
            for (let i=0; i < content.length; i++) {
              if (i === 0) {
                strDescription1 = content[i]
              } else if (i === 1) {
                strDescription2 = content[i]
              } else if (i === 2) {
                strAddFile = content[i]
              }
            }
          } else {
            strDescription1 = ''
            strDescription2 = ''
            addFile = ''
          }

          if (isEmpty(strAddFile))
          {
            const newParam = {
              description1: strDescription1,
              description2: strDescription2,
            }

            question.multiSelParam.push(newParam)
          } else {
            let rslt = []
            await Promise.all([commonSearchApi({ queryId: "searchFile02", param: {
              CMPNY_DIV: popupParams.CMPNY_DIV, FILE_ID: strAddFile, DESC1: strDescription1, DESC2: strDescription2 } })]).then(res => {
                rslt = res
            })
            if(rslt == null) {
              question.multiSelParam.push({description1: strDescription1, description2: strDescription2,addfile: ''})
            } else if(rslt.length <= 0) {
              question.multiSelParam.push({description1: strDescription1, description2: strDescription2,addfile: ''})
            } else if(rslt[0].ORESULT_CUR) {
              for(let i of rslt[0].ORESULT_CUR){ 
                await commonDownloadFilesApi(i).then(resFile=>{
                  question.multiSelParam.push({description1: i.DESC1, description2: i.DESC2, addfile: URL.createObjectURL(new Blob([resFile]))})
                }).catch(e => {
                  question.multiSelParam.push({description1: i.DESC1, description2: i.DESC2, addfile: '' })
                })
              }
            }
          }
        }
      } else if (quest.QSTN_TYPE === 'F') {
        const content = quest.QSTN_CONTENTS.split('&')
        let strLow = ''
        let strHigh = ''
        let sbPoint = []
        let strPoint = ''
        
        if (content.length > 0) {
          for (let i=0; i < content.length; i++) {
            if (i === 0) {
              strLow = content[i]
            } else if (i === 1) {
              strHigh = content[i]
            }
          }
          for (let i = strLow; i < strHigh; i++) {
            sbPoint.push(i)
            sbPoint.push("     ")
          }
          sbPoint.push(strHigh)
          strPoint = sbPoint.join("")
        }
        const newElement = {
          point: strPoint,
        }
        question.preferenceParam.push(newElement)
      }
    questionParam.value.push(question)
  }
}

// 문항 유형 항목 Clear
const clearRegion = () => {

  questionParam.value = []
}
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="900"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div 
      class="title-bar" 
      @mousedown="startDragging"
    >
      설문지 미리보기
    </div>
    <v-sheet 
      class="rounded-t-0 pa-2" 
      color="white"
    >
      <IGridTitle
        :use-permission="false"
        :button-list="['btnClose']"
        @click-button="onButtonsClick"
      />
      <div style="max-height:800px; overflow-y: auto;">
        <h1 class="mb-2">
          {{ popupParams.TITLE }}
        </h1>
        <h3 class="mb-2">
          {{ popupParams.SUVY_DESC }}
        </h3> 
        <v-text-field 
          v-if="popupParams.REG_YN == 'Y'"
          :label="$t('성명')"
          style="width:48%;"
          class="mb-2"
          readonly
        >
          <template v-slot:append-inner>
            <v-icon icon="mdi-magnify" />
          </template>
        </v-text-field>

        <div class="d-flex" v-if="popupParams.DEPT_YN == 'Y'">
          <v-text-field 
            :label="$t('부서')"
            width="50%"
            readonly
          >
          </v-text-field>
          <v-text-field 
            :label="$t('부서코드')"
            class="ml-1"
            width="50%"
            readonly
          >
            <template v-slot:append-inner>
              <v-icon icon="mdi-magnify" />
            </template>
          </v-text-field>
        </div>
        <div class="mt-2 mb-2 question" v-for="(question, index) in questionParam" :key="index">
          <v-card 
            color="#e2e3e5" 
            class="pa-3"
          >
            <p class="mt-1 mb-2 question-title">
              {{ (index+1) + '. ' + question.TITLE }}
            </p> 
            <h5 class="mb-2 question-desc" v-if="question.DESC">
              • {{ question.DESC }}
            </h5>
            <div 
              v-for="(element, index) in question.inputParam" 
              :key="index"
              class="mb-2"
            >
              <v-text-field 
                v-model="element.description"
                class="mt-2"
                readonly
              />
            </div>
            <div
              v-for="(element, index) in question.textParam" 
              :key="index"
              class="mb-2"
            >
              <v-textarea
                v-model="element.description"
                class="mt-2"
                readonly
              />
            </div>
            <div
              v-for="(element, index) in question.fileParam" 
              :key="index"
              class="mb-2" 
            >
              <v-card
                theme="dark"
                class="ma-2 ml-5"
                max-width="200"
              >
                <div class="d-flex fill-height align-center justify-center">
                  <v-scale-transition> 
                    <v-img :src="element.addfile" />
                  </v-scale-transition>
                </div>
              </v-card>
            </div>
            <div
              v-for="(element, index) in question.singleSelParam" 
              :key="index"
              class="mb-2"
            >
              <div class="d-flex mt-2">
                <input
                  v-model="element.radio"
                  class="mr-2" 
                  type="radio"
                  readonly
                />
                <v-text-field 
                  v-model="element.description1"
                  class="mr-2" 
                  readonly
                />
                <v-text-field
                  v-model="element.description2"
                  class="mr-2"
                  readonly
                />
              </div>
              <v-card
                theme="dark"
                class="ma-2 ml-5"
                max-width="200"
              >
                <div class="d-flex fill-height align-center justify-center">
                  <v-scale-transition> 
                    <v-img :src="element.addfile"/>
                  </v-scale-transition>
                </div>
              </v-card>
            </div>
            <div 
              v-for="(element, index) in question.multiSelParam"
              class="mb-2"
              :key="index"
            >
              <div class="d-flex mt-2">
                <input 
                  v-model="element.radio"
                  class="mr-2" 
                  type="checkbox" 
                  disabled="true"
                />
                <v-text-field 
                  v-model="element.description1"
                  class="mr-2"
                  readonly
                />
                <v-text-field 
                  v-model="element.description2"
                  class="mr-2"
                  readonly
                />
              </div>
              <v-card 
                theme="dark"
                class="ma-2 ml-5"
                max-width="200"
              >
                <div class="d-flex fill-height align-center justify-center">
                  <v-scale-transition> 
                    <v-img :src="element.addfile" />
                  </v-scale-transition>
                </div>
              </v-card>
            </div>
            <div
              v-for="(element, index) in question.preferenceParam" 
              :key="index"
              class="mb-2"
            >
              <div class="d-flex mt-2 preference pa-2">
                <span class="mr-2 formLabelText">
                  낮음
                </span>
                <span class="mr-2 formLabelText" style='letter-spacing:10px' >
                  {{ element.point }}
                </span>
                <span class="mr-2 formLabelText">
                  높음
                </span>
              </div>
            </div>
          </v-card>
        </div>
      </div>
    </v-sheet>
  </v-dialog>
</template>

<style scoped lang="scss">
.question {
  .question-title {
    font-size: 17px;
    font-weight: bold;
  }
  .question-desc {
    font-weight: 500;
  }
}

.preference {
  background: #f5f5f5;
  border-radius: 10px;
}
</style>