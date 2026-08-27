<!-- eslint-disable sonarjs/no-collapsible-if -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import ILabel from "@/components/ILabel.vue"
import IMenuTitle from '@/components/IMenuTitle.vue'
import { useI18n } from "vue-i18n"

defineOptions({
  name: '00_sample-TempTest',
})

const t = useI18n().t //다국어
const testRef = ref(null)

const dataParams = reactive({
  SELECT_ID: 'EDUAB0030_TAB01_POP2_POP1_SEARCH_01',
  INPUT:'    PROCEDURE UIDD1080C_SEARCH_01(\r\n'
    +    '  IN_CMPNY_DIV      IN VARCHAR2 -- 사업장구분\r\n'
     +   ', IN_EDU_DATE_FROM  IN VARCHAR2\r\n'
     +   ', IN_EDU_DATE_TO    IN VARCHAR2\r\n'
     +   ', IN_BSNS_CD        IN VARCHAR2\r\n'
     +   ', IN_ASGN_CD        IN VARCHAR2\r\n'
     +   ', ORESULT_CUR      OUT SYS_REFCURSOR\r\n'
    +');',
  OUTPUT:'',
  RADIO1:'1',
  RADIO2:'1',
})

onMounted(() => {
  
})

//메뉴버튼
const onButtonsClick = btn => {
  // eslint-disable-next-line sonarjs/no-collapsible-if
  if (btn.id === 'btnSearch'){
    if(dataParams.RADIO1 ==='2'){
      xml()
    }
    else if(dataParams.RADIO1 ==='1'){
      grid()
    }
  }
}

const grid = () => {
  var a = dataParams.INPUT.replaceAll('\t','  ').split('  ')
  var b = '// 중앙 정렬은 styleName 삭제 styleName: \'left-column\'/\'right-column\'\r\n'
  
  // console.log(a.length)
  for(var i=0; i<a.length;i++){
    //console.log('a[i] : ',a[i])
    if(dataParams.RADIO2 ==='1'){
      // 일반 그리드 컬럼
      // { fieldName: 'EDU_DTTM', dataType: 'text', header: { text: t('교육기간') }, editable: false },
      b += '{ fieldName: \'COL'+[i]+'\', dataType: \'text\', header: { text: t(\''+a[i]+'\') }, styleName: \'left-column\', editable: false },\r\n'
    }
    else if(dataParams.RADIO2 ==='2'){
      // 숨김 그리드 컬럼
      //{ fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
      b += '{ fieldName: \''+a[i]+'\', dataType: \'text\', visible: false },\r\n'
    }
  }
  dataParams.OUTPUT = b
}

const xml = () => {
  var a = dataParams.INPUT.replaceAll(/(\n|\r\n)/g,'<br>')
  var b = a.split('<br>')
  var c =''
  var count=0

  //console.log(b.length)
  for(var i=0; i<b.length;i++){
    //console.log(b[i])
    //console.log('indexOf : ',b[i].indexOf('PROCEDURE'))
    if(b[i].indexOf('PROCEDURE') > -1){
      //console.log('PROCEDURE 나온다', b[i])
      c = '<select id="'+dataParams.SELECT_ID+'" statementType="CALLABLE">\r\n'
        + '{call PKG_'+dataParams.SELECT_ID+'(\r\n'
    }
    else if(b[i].indexOf('IN_') > -1){
      /*
        console.log('IN_ 나온다', b[i])
        console.log('indexOf : ',b[i].indexOf('IN_'))
        console.log('lastIndexOf : ',b[i].lastIndexOf('IN'))
        console.log('중간자리 : ' ,b[i].substring(b[i].indexOf('IN_')+3,b[i].lastIndexOf('IN')))
        var d = b[i].split('')
        console.log('D의 길이가 나오냐?',d.length)
      */
     if(count===0){
      c+= '#{'+b[i].substring(b[i].indexOf('IN_')+3,b[i].lastIndexOf('IN')).trim()+', 		mode=IN, 	jdbcType=VARCHAR }\r\n '
     }else{
      c+= ', #{'+b[i].substring(b[i].indexOf('IN_')+3,b[i].lastIndexOf('IN')).trim()+', 		mode=IN, 	jdbcType=VARCHAR }\r\n '
     }
     count++
    }
    else if(b[i].indexOf('OUT') > -1){
    /*  
      console.log('OUT 나온다', b[i])
      console.log('indexOf : ',b[i].indexOf('OUT'))
      console.log('lastIndexOf : ',b[i].indexOf(','))
      console.log('중간자리 : ' ,b[i].substring(b[i].indexOf(',')+1,b[i].indexOf('OUT')))
    */
      c+= ', #{'+b[i].substring(b[i].indexOf(',')+1,b[i].indexOf('OUT')).trim()+', 		mode=OUT, 	jdbcType=CURSOR,	javaType=java.sql.ResultSet, resultMap=resultMap }\r\n'
    }
  }

  //console.log('전체값 : ',c+');')
  dataParams.OUTPUT = c+')}\r\n</select>'
}

const uploaded = param => {
  console.log('uploaded param', param)
}
</script>

<template>
  <div class="page-wrap">
    <VContainer>
      <!-- 타이틀 -->    
      <div class="contentPanel">    
        <VRow>
          <VCol>
            <IMenuTitle
              ref="menuTitle"
              :title="$t(useLogsStore().menuId)"
              :button-list="['btnSearch']"
              @click-button="onButtonsClick"
            />
          </VCol>
        </VRow>
        <!-- 조회조건 -->
        <!-- 조회조건 -->
        <VRow no-gutters>
          <VCol>
            <VForm
              ref="searchArea"
              class="searchArea"
            >
              <VRow>
                <!-- Radio -->
                <VCol cols="12" md="3" >  
                  <ILabel>
                    <template #editor="editorProps">
                      <VRadioGroup
                        v-model="dataParams.RADIO1"
                        inline
                      >
                        <VRadio value="1" label="그리드 컬럼" />
                        <VRadio value="2" label="XML" />
                      </VRadioGroup>
                    </template>      
                  </ILabel>
                </VCol>
                <VCol cols="12" md="3" >  
                  <ILabel>
                    <template #editor="editorProps">
                      <VRadioGroup
                        v-model="dataParams.RADIO2"
                        inline
                      >
                        <VRadio value="1" label="일반 그리드 컬럼" />
                        <VRadio value="2" label="숨김 그리드 컬럼" />
                      </VRadioGroup>
                    </template>      
                  </ILabel>
                </VCol>
              </VRow>
            </VForm>
          </VCol>
        </VRow>
        <!-- 메인 -->
        <VRow no-gutters>
          <VCol cols="12">
            <!-- 입력값 -->
            <ILabel
              :label="$t('select id')"
              label-loc="top"
            >
              <template #editor="editorProps">
                <VTextarea
                  v-model="dataParams.SELECT_ID"
                  rows="2"
                />
              </template>      
            </ILabel>
          </VCol>
          <VCol cols="12">
            <!-- 입력값 -->
            <ILabel
              :label="$t('입력값')"
              label-loc="top"
            >
              <template #editor="editorProps">
                <VTextarea
                  v-model="dataParams.INPUT"
                  rows="5"
                />
              </template>      
            </ILabel>
          </VCol>
        </VRow>
        <!-- 메인 -->
        <VRow no-gutters>
          <VCol cols="12">
            <!-- 출력값 -->
            <ILabel
              :label="$t('출력값')"
              label-loc="top"
            >
              <template #editor="editorProps">
                <VTextarea
                  v-model="dataParams.OUTPUT"
                  rows="5"
                />
              </template>      
            </ILabel>
          </VCol>
        </VRow>
      </div>
    </VContainer>
  </div>
</template>

<!--경로만 존재하면 로그인 없이 바로 이 페이지로 이동 가능-->
<route lang="yaml">
  meta: {
    noAuth: true
  }
</route>