//Requires
const modulename = 'WebServer:DeployerStepper';
const fs = require('fs-extra');
const { dir, log, logOk, logWarn, logError } = require('../../extras/console')(modulename);


/**
 * Returns the output page containing the live console
 * @param {object} ctx
 */
module.exports = async function DeployerStepper(ctx) {
    //Check permissions
    if(!ctx.utils.checkPermission('master', modulename)){
        return ctx.utils.render('basic/generic', {message: `You need to be the admin master to use the deployer.`});
    }

    //Check if this is the correct state for the deployer
    if(globals.deployer == null){
        const redirPath = (!globals.fxRunner.config.cfgPath || !globals.fxRunner.config.serverDataPath)? '/setup' : '/';
        return ctx.response.redirect(redirPath);
    }

    //Prepare Output
    const renderData = {
        step: globals.deployer.step,
        serverProfile: globals.info.serverProfile,
    };
    if(globals.deployer.step === 'review'){
        renderData.recipe = {
            isTrustedSource: globals.deployer.isTrustedSource,
            name: globals.deployer.recipe.name,
            version: globals.deployer.recipe.version,
            author: globals.deployer.recipe.author,
            description: globals.deployer.recipe.description,
            raw: globals.deployer.recipe.raw,
        }

    }else if(globals.deployer.step === 'input'){
        renderData.inputVars = [];
        const requiredVars = globals.deployer.getRequiredVars();
        // process the stuff then push to renderData.inputVars
        renderData.requireDBConfig = globals.deployer.recipe.requireDBConfig;

    }else if(globals.deployer.step === 'run'){
        renderData.deployPath = globals.deployer.deployPath;

    }else if(globals.deployer.step === 'configure'){
        const errorMessage = `# This recipe didn't create the ./server.cfg for you, meaning the process likely failed.
# Please make sure everything is correct, or insert here the contents of the ./server.cfg
# (╯°□°）╯︵ ┻━┻`;
        try {
            renderData.serverCFG = await fs.readFile(`${globals.deployer.deployPath}/server.cfg`, 'utf8');
            if(renderData.serverCFG == '#save_attempt_please_ignore' || !renderData.serverCFG.length){
                renderData.serverCFG = errorMessage;
            }
        } catch (error) {
            if(GlobalData.verbose) dir(error);
            renderData.serverCFG = errorMessage;
        }     

    }else{
        return ctx.utils.render('basic/generic', {message: `Unknown Deployer step, please report this bug and restart txAdmin.`});
    }

    return ctx.utils.render('basic/deployer', renderData);
};
