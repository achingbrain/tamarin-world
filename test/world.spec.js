'use strict'

const webDriver = require('selenium-webdriver')
const TamarinWorld = require('../lib/world')
const _ = require('lodash')
const chai = require('chai')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

proxyquire('./co-routines', {
  'get': (world) => ({})
});

chai
  .use(require('chai-things'))
  .use(require('chai-as-promised'))
  .should()

const expect = chai.expect

describe('world class', function () {
  it('can be instantiated', function () {
    const world = new TamarinWorld()
    world.setData('foo', 'bar')
    return world.getData('foo').should.eventually.equal('bar')
  })

  it('can set and retrieve a driver', function () {
    const phantomjs = webDriver.Capabilities.phantomjs()
    phantomjs.set('phantomjs.binary.path', require('phantomjs-prebuilt').path)
    const dummyDriver = new webDriver.Builder()
      .withCapabilities(phantomjs)
      .build()
    const world = new TamarinWorld(dummyDriver)
    return world.getDriver()
      .then((driver) => {
        driver.should.equal(dummyDriver)
        _.isFunction(driver.findElement).should.equal(true)
      })
  })

  it('can retrieve default driver', function () {
    new TamarinWorld().getDriver()
      .then((driver) => {
        _.isFunction(driver.findElement).should.equal(true)
      })
  })

  it('can set and retrieve the until module', function () {
    const dummyUntil = {
      getId: () => 'abc'
    }
    const world = new TamarinWorld(null, dummyUntil)
    const until = world.getUntil()
    until.should.equal(dummyUntil)
    until.getId().should.equal('abc')
  })

  describe('can be extended', function () {
    class World extends TamarinWorld {
      setTestVal (val) {
        this.setData('test', val)
      }

      getTestVal () {
        return this.getData('test')
      }
    }

    it('can be extended', function () {
      const world = new World()
      world.setTestVal('barfoo')
      return world.getTestVal().should.eventually.equal('barfoo')
    })

    it('should be context free', function () {
      const worldA = new World()
      worldA.setTestVal('barfoo')

      const worldB = new World()
      worldB.setTestVal('foobar')

      expect(worldA.getTestVal()).to.eventually.equal('barfoo')
      expect(worldB.getTestVal()).to.eventually.equal('foobar')
    })
  })

  describe('method', function () {
    let world, driver

    beforeEach(function () {
      world = new TamarinWorld()
      driver = {
        getCurrentUrl: () => Promise.resolve('/ready'),
        findElement: () => Promise.resolve(el),
        sleep: () => Promise.resolve(),
        get: () => Promise.resolve(),
        wait: (fn) => fn
      }
      sinon.stub(world, 'getDriver').returns({then: (fn) => fn(driver)})
    })

    afterEach(function () {
      world.getDriver.restore()
    })

    it('sleep', function () {
      const spy = sinon.spy(driver, 'sleep');
      world.sleep(10)
      sinon.assert.calledWith(spy, 10);
      driver.sleep.restore()
    })

    it('visit', function () {
      const spy = sinon.spy(driver, 'get');
      world.visit('abc')
      sinon.assert.calledWith(spy, 'abc');
      driver.get.restore()
    })

    it('waitForTitle', function () {
      world.waitForTitle('abc')
    })
  })
})
