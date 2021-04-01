/**
 *
 * Module Description
 * UE - mark Employee records for sending
 *
 * Version        	Date               		Author         		Remarks
 * 1.00             24 March 2021             kduque              Initial version
 *
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search', './lib/NSUtilvSS2'],
    /**
     * @param {record} record
     * @param {runtime} runtime
     * @param {search} search
     */
    function(record, runtime, search, NSUtil) {

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type
         * @param {Form} scriptContext.form - Current form
         * @Since 2015.2
         */
        function beforeLoad(scriptContext) {
            var form = scriptContext.form;

            if((scriptContext.type === scriptContext.UserEventType.CREATE
                || scriptContext.type === scriptContext.UserEventType.EDIT) &&
                (runtime.executionContext == runtime.ContextType.USER_INTERFACE) ){

            }
        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function beforeSubmit(scriptContext) {

            if((scriptContext.type === scriptContext.UserEventType.EDIT) &&
                (runtime.executionContext == runtime.ContextType.USER_INTERFACE) ){

                var objRecord = scriptContext.newRecord;
                var prevRecord = scriptContext.oldRecord;

                var coupaId = objRecord.getValue({fieldId: 'custentity_coupa_id'});
                var coupaIdPrev = prevRecord.getValue({fieldId: 'custentity_coupa_id'});
                didStatusChange(objRecord,coupaId,coupaIdPrev);

                var loginAccess = objRecord.getValue({fieldId: 'giveaccess'});
                var loginAccessPrev = prevRecord.getValue({fieldId: 'giveaccess'});
                didStatusChange(objRecord,loginAccess,loginAccessPrev);

                var empStatus = objRecord.getText({fieldId: 'employeestatus'});
                var empStatusPrev = prevRecord.getText({fieldId: 'employeestatus'});
                didStatusChange(objRecord,empStatus,empStatusPrev);

                var expenseUser = objRecord.getValue({fieldId: 'custentity_coupa_expense_user'});
                var expenseUserPrev = prevRecord.getValue({fieldId: 'custentity_coupa_expense_user'});
                didStatusChange(objRecord,expenseUser,expenseUserPrev);

                var authMethod = objRecord.getText({fieldId: 'custentity_nscs_coupa_auth_method'});
                var authMethodPrev = prevRecord.getText({fieldId: 'custentity_nscs_coupa_auth_method'});
                didStatusChange(objRecord,authMethod,authMethodPrev);

                var email = objRecord.getValue({fieldId: 'email'});
                var emailPrev = prevRecord.getValue({fieldId: 'email'});
                didStatusChange(objRecord,email,emailPrev);

                var genPassNotifyUser = objRecord.getValue({fieldId: 'custentity_nscs_coupa_gen_pass_not_user'});
                var genPassNotifyUserPrev = prevRecord.getValue({fieldId: 'custentity_nscs_coupa_gen_pass_not_user'});
                didStatusChange(objRecord,genPassNotifyUser,genPassNotifyUserPrev);

                var firstName = objRecord.getValue({fieldId: 'firstname'});
                var firstNamePrev = prevRecord.getValue({fieldId: 'firstname'});
                didStatusChange(objRecord,firstName,firstNamePrev);

                var lastName = objRecord.getValue({fieldId: 'lastname'});
                var lastnNamePrev = prevRecord.getValue({fieldId: 'lastname'});
                didStatusChange(objRecord,lastName,lastnNamePrev);

                var entityId = objRecord.getValue({fieldId: 'entityid'});
                var entityIdPrev = prevRecord.getValue({fieldId: 'entityid'});
                didStatusChange(objRecord,entityId,entityIdPrev);

                var expAppLimit = objRecord.getValue({fieldId: 'custentity_nscs_coupa_exp_approval_limit'});
                var expAppLimitPrev = prevRecord.getValue({fieldId: 'custentity_nscs_coupa_exp_approval_limit'});
                didStatusChange(objRecord,expAppLimit,expAppLimitPrev);

                var supEmail = objRecord.getValue({fieldId: 'custentity_nscs_supervisor_email'});
                var supEmailPrev = prevRecord.getValue({fieldId: 'custentity_nscs_supervisor_email'});
                didStatusChange(objRecord,supEmail,supEmailPrev);

                var subsidiary = objRecord.getValue({fieldId: 'subsidiary'});
                var subsidiaryPrev = prevRecord.getValue({fieldId: 'subsidiary'});
                didStatusChange(objRecord,subsidiary,subsidiaryPrev);

                var department = objRecord.getText({fieldId: 'department'});
                var departmentPrev = prevRecord.getText({fieldId: 'department'});
                didStatusChange(objRecord,department,departmentPrev);

                var location = objRecord.getText({fieldId: 'location'});
                var locationPrev = prevRecord.getText({fieldId: 'location'});
                didStatusChange(objRecord,location,locationPrev);

                var coupaUserType = objRecord.getText({fieldId: 'custentity_sc_coupa_user_type'});
                var coupaUserTypePrev = prevRecord.getText({fieldId: 'custentity_sc_coupa_user_type'});
                didStatusChange(objRecord,coupaUserType,coupaUserTypePrev);

                var defaultCurrency = objRecord.getText({fieldId: 'defaultexpensereportcurrency'});
                var defaultCurrencyPrev = prevRecord.getText({fieldId: 'defaultexpensereportcurrency'});
                didStatusChange(objRecord,defaultCurrency,defaultCurrencyPrev);

                var defaultLocale = objRecord.getText({fieldId: 'custentity_nscs_coupa_def_locale'});
                var defaultLocalePrev = prevRecord.getText({fieldId: 'custentity_nscs_coupa_def_locale'});
                didStatusChange(objRecord,defaultLocale,defaultLocalePrev);

                var countryCode = objRecord.getValue({fieldId: 'custentity_nscs_country_code'});
                var countryCodePrev = prevRecord.getValue({fieldId: 'custentity_nscs_country_code'});
                didStatusChange(objRecord,countryCode,countryCodePrev);

            }
        }
        function didStatusChange(objRecord, currRecord, prevRecord) {

            var internalId  = objRecord.id;

            var updateObj = [];

            if(currRecord !== prevRecord){

                updateObj.push(currRecord);

                log.debug("Field CHANGE!");

                if (!NSUtil.isEmpty(internalId)) {
                    objRecord.setValue({
                        fieldId: 'custentity_sc_send_to_coupa',
                        value: true
                    });
                }
            } else {
                return false;
            }

            log.debug('updateObj ctr', updateObj.length);
        }

        return {
            //beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit
        };

    });
