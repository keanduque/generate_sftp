/**
 *
 * Module Description
 * SL - Generate SFTP Password for GUID
 *
 * Version    History        Author             Remarks
 * -------    -----------    --------------     --------------------------------------------------------------------
 * 1.00       17 Mar 2021    kduque             initial version
 *
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope Public
 */

define(['N/record', 'N/runtime', 'N/ui/serverWidget', './lib/NSUtilvSS2', 'N/encode', 'N/crypto', 'N/search'],

    function(record, runtime, serverWidget, NSUtil, encode, crypto, search){

        var objScript = runtime.getCurrentScript();

        var formTitle = objScript.getParameter({
            name: 'custscript_ps_sftp_form_title'
        });
        var configId = objScript.getParameter({
            name: 'custscript_ps_sftp_config'
        });

        function onRequest(context){
            var objRequest = context.request;
            var params = objRequest.parameters;

            var objResponse = context.response;

            //Get Configuration record
            var procMssg = '';
            var configRec = '';
            var serverAddr = '';

            if (!NSUtil.isEmpty(configId)){

                try{
                    configRec = record.load({
                        type: 'customrecord_ps_sftp_config',
                        id: configId
                    });

                    serverAddr = configRec.getValue({
                        fieldId: 'custrecord_sc_server'
                    });

                }catch(ex){
                    var errorStr = (ex.id != null) ? ex.name + '\n' + ex.message + '\n' : ex.toString();
                    log.error('loadConfig', 'Error encountered while loading Configuration record. Error: ' + errorStr);
                    procMssg = errorStr;
                }

            }else{
                procMssg = 'Configuration record not found; please contact your Administrator.'
            }

            if (NSUtil.isEmpty(serverAddr)){
                procMssg = 'sFTP Server is not configured; please contact your Administrator.';
            }

            var form = serverWidget.createForm({
                title: formTitle,
                hideNavBar: false
            });

            if (objRequest.method == 'GET'){

                if (!NSUtil.isEmpty(procMssg)){

                    var fldProcMssg = form.addField({
                        id: 'custpage_proc_mssg',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Process Message'
                    });
                    fldProcMssg.defaultValue = procMssg;
                    fldProcMssg.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.INLINE
                    });

                }else{

                    var fldCred = form.addCredentialField({
                        id: 'custpage_guid',
                        label: 'sFTP Password',
                        restrictToScriptIds: ['customscript_nscs_sl_gen_sftp_pw_guid',
                            'customscript_nscs_mr_extract_send_sftp'],
                        restrictToDomains: serverAddr,
                        restrictToCurrentUser: false
                    });
                    fldCred.isMandatory = true;

                    form.addSubmitButton();
                }

                objResponse.writePage(form);

            }else{

                var procMssg = 'Secret key generated successfully.';

                try{
                    var myGuid = params.custpage_guid;
                    log.debug('myGuid', 'myGuid=' + myGuid);

                    if (!NSUtil.isEmpty(myGuid)){

                        if (!NSUtil.isEmpty(configId)){

                            record.submitFields({
                                type: 'customrecord_ps_sftp_config',
                                id: configId,
                                values: {
                                    custrecord_sc_sftp_guid: myGuid
                                }
                            });

                        }else{
                            procMssg = 'Configuration record not found; please contact your Administrator.';
                        }

                    }else{
                        procMssg = 'Secret key generation failed.';
                    }

                }catch(ex){
                    var errorStr = (ex.id != null) ? ex.name + '\n' + ex.message + '\n' : ex.toString();
                    log.error('genSecretKey', 'Error encountered while generating Secret Key. Error: ' + errorStr);
                    procMssg = errorStr;
                }

                var fldProcMssg = form.addField({
                    id: 'custpage_proc_mssg',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Process Message'

                });
                fldProcMssg.defaultValue = procMssg;
                fldProcMssg.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE
                });

                objResponse.writePage(form);
            }
        }

        return{
            onRequest: onRequest
        };
    });
