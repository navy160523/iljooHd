<script setup>
import tree from '@images/pages/tree.png'
import authV2LoginIllustrationBorderedDark from '@images/pages/auth-v2-login-illustration-bordered-dark.png'
import authV2LoginIllustrationBorderedLight from '@images/pages/auth-v2-login-illustration-bordered-light.png'
import authV2LoginIllustrationDark from '@images/pages/auth-v2-login-illustration-dark.png'
import authV2LoginIllustrationLight from '@images/pages/auth-v2-login-illustration-light.png'
import authV2MaskDark from '@images/pages/auth-v2-mask-dark.png'
import authV2MaskLight from '@images/pages/auth-v2-mask-light.png'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import { themeConfig } from '@themeConfig'
import { useRouter, useRoute } from 'vue-router'
import Message from '@hiway/utils/notify'

/* 언어 */
import { useI18n } from 'vue-i18n'
import { loadLanguageAsync } from "@/plugins/i18n"
import { useThemeConfig } from "@core/composable/useThemeConfig"

import { useUserStore } from '@hiway/stores/user'
import { useMenuStore } from '@hiway/stores/menu'
import { required, passwordValidator, confirmedValidator } from '@hiway/utils/validation'
import notify from '@hiway/utils/notify'
import { resetPassword } from '@hiway/api/user'
import { onMounted } from 'vue'
import HDLogo from '@/assets/images/ci/hd_logo_ko.png'
import HDLogo_2 from '@/assets/images/ci/hd_logo_en.png'
// import HDLogo from '@/assets/images/index/login/HDLogo.png'
// import HSElogo from '@hiway/assets/images/svg/HSElogo.svg'

import { getClientIp } from "@hiway/api/utilsApi"


// image
const authThemeImg = useGenerateImageVariant(authV2LoginIllustrationLight, authV2LoginIllustrationDark, authV2LoginIllustrationBorderedLight, authV2LoginIllustrationBorderedDark, true)
const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

const { t } = useI18n()
const  i18n  = useI18n()
const { isAppRtl } = useThemeConfig()
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const menuStore = useMenuStore()

const loginForm = ref({
  user_id: '',
  password: '',
  remember: false,
})

const isPasswordVisible = ref(false)
const errorMessages = ref([])
const refLoginVForm = ref()
const isSaveId = ref('N')
const clientIp = ref()

// const HDLogoImport = HDLogo

//  캐러셀 관련 이벤트
const model = ref(0)


const modelController = (item,i) =>{
  if(model.value >= '3'){
    model.value = 0
  }
  else{
    model.value++
  }
  
}


// 
const signIn = () => {
  setCookie()

  refLoginVForm.value?.validate().then(({ valid: isValid }) => {
    if(isValid) {      
      userStore.loginByPassword(loginForm.value.user_id, loginForm.value.password).then(() => {       
        userStore.setUserInfo().then(() => {
          menuStore.getMenus()
          // menuStore.getMenus().then(() => {
            const queryTest = route.query.return_url
            
            if (queryTest) {
              console.log('queryTest',queryTest)
                router.push(queryTest)
            } else {
                router.push('/')
            }	
          // })
          menuStore.getMyMenus()
          // router.push('/')
        })
      }).catch(e => {    
        // console.error('login fail', e)

        switch(e.response.data.result.code) {
        case '40000413':
          alert(t('msg.first-login'))
          resetPasswordModalVisible.value = true
          break
        case '40000414':
          alert(t('3month-change-password'))
          resetPasswordModalVisible.value = true
          break
        case '40000115':
          break
        case '40300416':          
          break
        default:
          // errorMessages.value = [t('xbuilder.msg.error-login')]

          Message.err(t('xbuilder.msg.error-login'))
        }
      })
    }
  })
}

const signIn2 = () => {
  if(loginForm.value.user_id === ''){
    return
  }

  setCookie()

  refLoginVForm.value?.validate().then(({ valid: isValid }) => {
    
    if(isValid) {
      const data = {
        EMP_NO: loginForm.value.user_id,
      }
      userStore.loginPass(loginForm.value.user_id, data).then(() => {    
        
        userStore.setUserInfo().then(() => {
          
          menuStore.getMenus()

          const queryTest = route.query.return_url
            
          if (queryTest) {
            console.log('queryTest',queryTest)
              router.push(queryTest)
          } else {
              router.push('/')
          }	
          
          // menuStore.getMenus().then(() => {
            // const queryTest = route.query.return_url
            // console.log('queryTest',queryTest)
            // if (queryTest) {
            //     router.push(queryTest)
            // } else {
            //     router.push('/')
            // }	
          // })
          menuStore.getMyMenus()
          // router.push('/')
          
        })
      }).catch(e => {    
        // console.error('login fail', e)

        switch(e.response.data.result.code) {
        case '40000413':
          alert(t('msg.first-login'))
          resetPasswordModalVisible.value = true
          break
        case '40000414':
          alert(t('3month-change-password'))
          resetPasswordModalVisible.value = true
          break
        case '40000115':
          break
        case '40300416':          
          break
        default:
          // errorMessages.value = [t('xbuilder.msg.error-login')]

          Message.err(t('xbuilder.msg.error-login'))
        }
      })
    }
  })
}

// 비밀번호 초기화
// modal value
const resetPasswordModalVisible = ref(false)

// template ref
const refResetPasswordVForm = ref()

// from data
const resetPasswordForm = ref({
  password: '',
  confirmPassword: '',
})

const fnResetPassword = () => {
  refResetPasswordVForm.value?.validate().then(({ valid: isValid }) => {
    if(isValid) {
      const params = {
        user_id: loginForm.value.user_id,
        password: resetPasswordForm.value.password,
      }

      resetPassword(params).then(() => {
        notify.info(t('xbuilder.msg.complete-password'))
        resetPasswordModalVisible.value=false
      })
    }
  }) 
}

// clear form
watch(() => resetPasswordModalVisible.value, newValue => {
  if(newValue) return
  refResetPasswordVForm.value?.reset()  
})

const language = ref('ko')

const langChange = lang => {
  // lang.value = langs;
  loadLanguageAsync(i18n, lang)
  isAppRtl.value = lang === 'ar'
}

const setCookie = () => {
  let cookieName = 'SAVED_ID'
  let isCheck = isSaveId.value            // 체크 여부
  let value = loginForm.value.user_id     // 아이디
  let date = new Date(Date.now() + 86400e3 * 7)
  let expireDate = 'expires=' + date.toUTCString() // 7일 

  document.cookie = cookieName + '=' + isCheck + '=' + value + ';' + expireDate
}

onMounted(() => {
  loadLanguageAsync(i18n, 'ko')
  let docCookie = document.cookie

  if (docCookie === null) {
    return
  }else {
    let value = docCookie.match("SAVED_ID" + '=([^;]*)')
    let value2 = value[1].split('=')

    if(value2[0] === 'Y'){
      isSaveId.value = value2[0]
      loginForm.value.user_id = value2[1]
    }
  }
})


</script>

<template>
  <div>
    <VRow
      no-gutters
      class="auth-wrapper"
    >
      <VCol
        md="8"
        class="d-none d-md-flex align-center justify-center position-relative"
      >

      <!--  수정예정 -->
      <v-carousel cycle hide-delimiters v-model="model" style="width: 100%; height: 100vh;  background-color: #000;"
      :show-arrows="false">
      
      <!-- 특수선 제외요청 -->
        <!--
        <v-carousel-item cover >
        <img class="imgStyle"  src="../assets/images/index/login/login_bg01.jpg">
        </v-carousel-item>
        -->
          <v-carousel-item cover>
          <!-- <img  class="imgStyle"  src="../assets/images/index/login/login_bg02.jpg"> -->
          <img  class="imgStyle"  src="../assets/images/index/login/login_bg_new01.jpg">
        </v-carousel-item>

          <v-carousel-item cover>
          <img  class="imgStyle"  src="../assets/images/index/login/login_bg02.jpg">
        </v-carousel-item>
          <v-carousel-item cover>
          <!-- <img  class="imgStyle"  src="../assets/images/index/login/login_bg04.jpg"> -->
          <img  class="imgStyle"  src="../assets/images/index/login/login_bg_new03.jpg">
        </v-carousel-item>
          <v-carousel-item cover>
          <!-- <img  class="imgStyle"  src="../assets/images/index/login/login_bg05.jpg"> -->
          <img  class="imgStyle"  src="../assets/images/index/login/login_bg_new04.jpg" width="100%" height="100%">
        </v-carousel-item>
        </v-carousel>
        <!--  ==============================  -->


    <v-row no-gutters  align="center" style="position: absolute; width: 100%;">
      <v-col cols="5" style="margin-left: 77px;">
       <h3 style="font-weight: 300; color:#fff; font-size: 33px;">
          <span style="font-weight: bold;">{{ t("login.subContents1") }}</span>{{ t("login.subContents2") }} 
          <span style="font-weight: bold;">{{ t("login.subContents3") }}</span>{{ t("login.subContents4") }}
          <span style="font-weight: bold;">{{ t("login.subContents5") }}</span> 
        </h3>
      </v-col>
      <v-col cols="5" style="margin-right: 61px;">
        <hr style="height: 1px; background-color: #fff; border: none;">
      </v-col>
      
      </v-row>
      
      
    <v-row no-gutters  align="center" style="position: absolute; bottom: 6%; width: 100%;">
      <v-col cols="5" style="margin-left: 77px;  display: flex;  align-items: center;">
        <div v-for="(item, i) in 4" :key="i" @click="modelController(item,i)" :class="[ 'sideBtn', {'activeSideBtn': model === i } ]"/>
      
      </v-col>
     
      </v-row>

      </VCol>

      <VCol
        cols="12"
        md="4"
        class="auth-card-v2 d-flex align-center justify-center"
      >
        <VCard
          flat
          :max-width="500"
          :min-width="500"
          class="mt-12 mt-sm-0 pa-4"
        >
          <VCardText class="mL-6 pB-30 flex-column text-center">
            <!-- <img :src="themeConfig.app.logo"> -->
            <!-- <svg-icon name="HSElogo" /> -->
            <svg-icon name="HSElogo_login" class="hisesLogo mb-3"/>
            <div class="koginTitleText mt-3">{{ t("login.title") }}</div> 
          </VCardText>
          <VCardText class="pa-0 mt-4">
            <VForm
              ref="refLoginVForm"
              @submit.prevent="signIn"
            >
              <VRow>
                <!-- email -->
                <VCol cols="12">
                  <VTextField
                    v-model="loginForm.user_id"
                    :placeholder="$t('xbuilder.id')"
                    type="text"
                    color="primary"
                    :rules="[required($t('xbuilder.msg.required-id'))]"
                    density="compact"              
                    class="mb-4 login_text_field"                  
                  />
                </VCol>

                <!-- password -->
                <VCol cols="12" class="pt-0">
                  <VTextField
                    v-model="loginForm.password"
                    :placeholder="$t('xbuilder.password')"
                    :type="isPasswordVisible ? 'text' : 'password'"
                    :append-inner-icon="isPasswordVisible ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                    :rules="[required($t('xbuilder.msg.required-password'))]"                  
                    density="compact"
                    color="primary"
                    :height="65"
                    class="mb-5 login_text_field"
                    @click:append-inner="isPasswordVisible = !isPasswordVisible"                    
                  />
                  <!-- <p
                    v-for="(message, index) of errorMessages"
                    :key="index"
                    class="mt-2 text-error"
                  >
                    {{ message }}
                  </p> -->

                  <!-- <div class="d-flex align-center flex-wrap justify-end mt-1 mb-4">                    
                    <routerLink
                      class=" ms-2 mb-1 text-textCaption"
                      to="/forgot-password"
                    >
                      {{ $t('xbuilder.login.findPassword') }}
                    </routerLink>
                  </div> -->

                  <!-- style="background: linear-gradient(90deg, #1A40C7 0%, #2265F4 100%);" -->
                  <VBtn
                    block
                    type="submit"
                    rounded
                    height="54"  
                    class="ma-0 loginBtn"
                  >
                    <span style="font-size: 16px; font-weight: 800;">{{ t("login.btn1") }}</span>
                  </VBtn>
                  <!-- 통합인증 로그인 버튼 주석 -->
                  <!-- <VBtn
                    style="color: #1A40C7;"
                    color="white"
                    block
                    rounded
                    variant="outlined"
                    height="54"  
                    class="ma-0 mt-3 loginBtn2"
                  >
                    <span style="font-size: 16px; font-weight: 800;">{{ t("login.btn2") }}</span>
                  </VBtn>  -->
                </VCol>

                <!-- 임시 주석 -->
                <!-- <VCol>
                  <div class="d-flex justify-space-between">
                    <v-sheet>
                      <VCheckbox
                        true-value="Y"
                        false-value="N"
                        small
                        :label="t('login.saveId')" 
                        class="ml-0"
                        v-model="isSaveId"
                      />
                    </v-sheet>
                    <v-sheet width="30%">
                      <v-select
                        :items="[
                          {TXT: '한국어', COD: 'ko'}, 
                          {TXT: 'English', COD: 'en'}
                        ]"
                        variant="solo"
                        v-model="language"
                        item-title="TXT"
                        item-value="COD"
                        @update:model-value="langChange"
                      />
                    </v-sheet>
                  </div>
                </VCol> -->

                <!-- create account -->
                <!-- <VCol
                  cols="12"
                  class="text-center"
                >
                  <span class="text-black">{{ $t('xbuilder.login.questionCreateAccount') }}</span>
                  <routerLink
                    class="ms-2 font-weight-bold text-primary"
                    to="/register"
                  >
                    {{ $t('xbuilder.login.createAccount') }}
                  </routerLink>
                </VCol>                        -->
              </VRow>
            </VForm>
          </VCardText>
        </VCard>
        
           <div style="position: absolute; bottom: 12%;">
            <img id="hdLOGO" :src="language === 'ko' ? HDLogo : HDLogo_2"  width="120px" @click="signIn2">
           </div>
      </VCol>
    </VRow>


  </div>
  <VDialog
    v-model:model-value="resetPasswordModalVisible"
    width="390"
    persistent
  >
    <VCard>
      <VToolbar
        color="primary"
        dark
      >
        <VToolbarTitle>
          {{ $t('xbuilder.Reset Password') }}
        </VToolbarTitle>
        <VSpacer />
        <VBtn
          icon="mdi-close"          
          color="default"
          @click="resetPasswordModalVisible = false"
        />
      </VToolbar>
      <VForm
        ref="refResetPasswordVForm"
        @submit.prevent="fnResetPassword"
      >           
        <VCardText>        
          <VTextField
            v-model="resetPasswordForm.password"
            :label="$t('xbuilder.password')"
            type="password"
            :rules="[passwordValidator]"
          />
          <VTextField
            v-model="resetPasswordForm.confirmPassword"
            :label="$t('xbuilder.Confirm password')"
            type="password"
            class="mt-2"
            :rules="[confirmedValidator(resetPasswordForm.password, resetPasswordForm.confirmPassword)]"
          />
        </VCardText>
        <VDivider />
        <VCardActions class="py-2 justify-end">
          <VBtn 
            color="primary"
            variant="elevated"
            type="submit"
          >
            {{ $t('xbuilder.Save') }}
          </VBtn>
        </VCardActions>
      </VForm>        
    </VCard>
  </VDialog>
  
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth.scss";

.imgStyle{
  width: 100%;
    height: 100vh;
    object-fit: cover;
    opacity: 0.6;
}
.sideBtn{
  cursor: pointer;
  width: 6px;
  height: 6px;
  border-radius: 5px;
  margin-left: 5px;
  background: rgba(255, 255, 255, 0.50);
  transition: all, 3s
}

.activeSideBtn{
  width: 16px;
  background: rgba(255, 255, 255, 0.80);
}

.auth-wrapper{
  .mB-11{
  .v-field__input{
    height: 45px;  }
  }
}


.koginTitleText {
  font-size: 22px;
  font-weight: 600;
  color: #4d4d4d;

  font-family: Pretendard, Roboto, Spoqa Han Sans Neo, sans-serif !important;
}

.login_text_field {
  // font-size: 14pt !important;
  
  .v-field__input {
    min-height: 50px !important;
  }
}
.loginBtn {
  font-size: 18px;
  font-weight: 500;
  font-family: Pretendard, Roboto, Spoqa Han Sans Neo, sans-serif !important;
  border-radius: 5px !important;

}

.loginBtn:hover {
  background-color: rgba(6,31,120,1) !important;
}

.loginBtn2 {
  font-size: 18px;
  font-weight: 500;
  font-family: Pretendard, Roboto, Spoqa Han Sans Neo, sans-serif !important;
  border-radius: 5px !important;
  color: #1A40C7 !important;
}
</style>

<route lang="yaml">
meta:
  layout: blank
  redirectIfLoggedIn: true
</route>
